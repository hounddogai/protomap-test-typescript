import * as text from "../../../../kit/text.js";

/** Where a manual preference review is in its life cycle. */
export type ManualPreferenceReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a manual preference review and its current status. */
export class ManualPreferenceReview {
  code: string;
  name: string;
  frequencyCap: number;
  maximum: number;
  cost: number;
  retries: number;
  amount: number;
  ratio: number;
  active: boolean;
  status: ManualPreferenceReviewStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    maximum: number,
    cost: number,
    retries: number,
    amount: number,
    ratio: number,
    active: boolean,
    status: ManualPreferenceReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.cost = cost;
    this.retries = retries;
    this.amount = amount;
    this.ratio = ratio;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualPreferenceReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPreferenceReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual preference review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.ratio - this.maximum) * 100) / 100;
  }

  copy(): ManualPreferenceReview {
    return new ManualPreferenceReview(
      this.code,
      this.name,
      this.frequencyCap,
      this.maximum,
      this.cost,
      this.retries,
      this.amount,
      this.ratio,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual preference review in status new. */
export function newManualPreferenceReview(code: string, name: string): ManualPreferenceReview {
  return new ManualPreferenceReview(code, name, 0, 0, 0, 0, 0, 0, false, "new");
}
