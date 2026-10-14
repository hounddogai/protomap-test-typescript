import * as text from "../../../../kit/text.js";

/** Where a pending bid rule variance is in its life cycle. */
export type PendingBidRuleVarianceStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending bid rule variance and its current status. */
export class PendingBidRuleVariance {
  code: string;
  title: string;
  priority: number;
  frequencyCap: number;
  limit: number;
  ratio: number;
  active: boolean;
  status: PendingBidRuleVarianceStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    frequencyCap: number,
    limit: number,
    ratio: number,
    active: boolean,
    status: PendingBidRuleVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.ratio = ratio;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingBidRuleVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingBidRuleVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bid rule variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.ratio - this.limit) * 100) / 100;
  }

  copy(): PendingBidRuleVariance {
    return new PendingBidRuleVariance(
      this.code,
      this.title,
      this.priority,
      this.frequencyCap,
      this.limit,
      this.ratio,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending bid rule variance in status created. */
export function newPendingBidRuleVariance(code: string, title: string): PendingBidRuleVariance {
  return new PendingBidRuleVariance(code, title, 0, 0, 0, 0, false, "created");
}
