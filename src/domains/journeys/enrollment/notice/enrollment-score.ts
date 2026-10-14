import * as text from "../../../../kit/text.js";

/** Where a enrollment score is in its life cycle. */
export type EnrollmentScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a enrollment score and its current status. */
export class EnrollmentScore {
  code: string;
  label: string;
  bid: number;
  audienceId: string;
  conversionRate: number;
  amount: number;
  ownerId: string;
  threshold: number;
  status: EnrollmentScoreStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    audienceId: string,
    conversionRate: number,
    amount: number,
    ownerId: string,
    threshold: number,
    status: EnrollmentScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.audienceId = audienceId;
    this.conversionRate = conversionRate;
    this.amount = amount;
    this.ownerId = ownerId;
    this.threshold = threshold;
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

  canMoveTo(next: EnrollmentScoreStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: EnrollmentScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.threshold + this.bid) * 100) / 100;
  }

  copy(): EnrollmentScore {
    return new EnrollmentScore(
      this.code,
      this.label,
      this.bid,
      this.audienceId,
      this.conversionRate,
      this.amount,
      this.ownerId,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a enrollment score in status new. */
export function newEnrollmentScore(code: string, label: string): EnrollmentScore {
  return new EnrollmentScore(code, label, 0, "", 0, 0, "", 0, "new");
}
