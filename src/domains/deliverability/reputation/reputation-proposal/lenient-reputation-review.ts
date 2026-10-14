import * as text from "../../../../kit/text.js";

/** Where a lenient reputation review is in its life cycle. */
export type LenientReputationReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient reputation review and its current status. */
export class LenientReputationReview {
  code: string;
  label: string;
  cohort: string;
  unit: string;
  ratio: number;
  weight: number;
  budget: number;
  checksum: string;
  quantity: number;
  campaignRef: string;
  status: LenientReputationReviewStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    unit: string,
    ratio: number,
    weight: number,
    budget: number,
    checksum: string,
    quantity: number,
    campaignRef: string,
    status: LenientReputationReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.unit = unit;
    this.ratio = ratio;
    this.weight = weight;
    this.budget = budget;
    this.checksum = checksum;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientReputationReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientReputationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reputation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.budget + this.weight) * 100) / 100;
  }

  copy(): LenientReputationReview {
    return new LenientReputationReview(
      this.code,
      this.label,
      this.cohort,
      this.unit,
      this.ratio,
      this.weight,
      this.budget,
      this.checksum,
      this.quantity,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient reputation review in status proposed. */
export function newLenientReputationReview(code: string, label: string): LenientReputationReview {
  return new LenientReputationReview(code, label, "", "", 0, 0, 0, "", 0, "", "proposed");
}
