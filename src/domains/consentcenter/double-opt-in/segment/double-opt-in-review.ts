import * as text from "../../../../kit/text.js";

/** Where a double opt in review is in its life cycle. */
export type DoubleOptInReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One double opt in review, with what the planners need to act on it. */
export class DoubleOptInReview {
  code: string;
  label: string;
  unit: string;
  priority: number;
  journeyId: string;
  openRate: number;
  margin: number;
  amount: number;
  status: DoubleOptInReviewStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    priority: number,
    journeyId: string,
    openRate: number,
    margin: number,
    amount: number,
    status: DoubleOptInReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.priority = priority;
    this.journeyId = journeyId;
    this.openRate = openRate;
    this.margin = margin;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DoubleOptInReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round(this.priority * this.openRate * 100) / 100;
  }

  copy(): DoubleOptInReview {
    return new DoubleOptInReview(
      this.code,
      this.label,
      this.unit,
      this.priority,
      this.journeyId,
      this.openRate,
      this.margin,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a double opt in review in status requested. */
export function newDoubleOptInReview(code: string, label: string): DoubleOptInReview {
  return new DoubleOptInReview(code, label, "", 0, "", 0, 0, 0, "requested");
}
