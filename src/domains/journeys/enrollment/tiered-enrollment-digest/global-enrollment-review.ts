import * as text from "../../../../kit/text.js";

/** Where a global enrollment review is in its life cycle. */
export type GlobalEnrollmentReviewStatus = "created" | "validated" | "published" | "retired";

/** The record of a global enrollment review and its current status. */
export class GlobalEnrollmentReview {
  code: string;
  label: string;
  source: string;
  cost: number;
  createdAt: number;
  active: boolean;
  channel: string;
  pinned: boolean;
  frequencyCap: number;
  country: string;
  unit: string;
  status: GlobalEnrollmentReviewStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    cost: number,
    createdAt: number,
    active: boolean,
    channel: string,
    pinned: boolean,
    frequencyCap: number,
    country: string,
    unit: string,
    status: GlobalEnrollmentReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.cost = cost;
    this.createdAt = createdAt;
    this.active = active;
    this.channel = channel;
    this.pinned = pinned;
    this.frequencyCap = frequencyCap;
    this.country = country;
    this.unit = unit;
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

  canMoveTo(next: GlobalEnrollmentReviewStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalEnrollmentReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global enrollment review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.frequencyCap * this.cost * 100) / 100;
  }

  copy(): GlobalEnrollmentReview {
    return new GlobalEnrollmentReview(
      this.code,
      this.label,
      this.source,
      this.cost,
      this.createdAt,
      this.active,
      this.channel,
      this.pinned,
      this.frequencyCap,
      this.country,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global enrollment review in status created. */
export function newGlobalEnrollmentReview(code: string, label: string): GlobalEnrollmentReview {
  return new GlobalEnrollmentReview(code, label, "", 0, 0, false, "", false, 0, "", "", "created");
}
