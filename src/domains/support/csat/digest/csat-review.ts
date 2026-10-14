import * as text from "../../../../kit/text.js";

/** Where a csat review is in its life cycle. */
export type CsatReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One csat review, with what the planners need to act on it. */
export class CsatReview {
  code: string;
  label: string;
  attempts: number;
  budget: number;
  category: string;
  version: number;
  discount: number;
  cohort: string;
  journeyId: string;
  rate: number;
  channel: string;
  status: CsatReviewStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    budget: number,
    category: string,
    version: number,
    discount: number,
    cohort: string,
    journeyId: string,
    rate: number,
    channel: string,
    status: CsatReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.budget = budget;
    this.category = category;
    this.version = version;
    this.discount = discount;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.rate = rate;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CsatReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.version - this.attempts) * 100) / 100;
  }

  copy(): CsatReview {
    return new CsatReview(
      this.code,
      this.label,
      this.attempts,
      this.budget,
      this.category,
      this.version,
      this.discount,
      this.cohort,
      this.journeyId,
      this.rate,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a csat review in status planned. */
export function newCsatReview(code: string, label: string): CsatReview {
  return new CsatReview(code, label, 0, 0, "", 0, 0, "", "", 0, "", "planned");
}
