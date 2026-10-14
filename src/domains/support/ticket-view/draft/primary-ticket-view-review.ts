import * as text from "../../../../kit/text.js";

/** Where a primary ticket view review is in its life cycle. */
export type PrimaryTicketViewReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One primary ticket view review, with what the planners need to act on it. */
export class PrimaryTicketViewReview {
  code: string;
  label: string;
  budget: number;
  externalRef: string;
  floorValue: number;
  batchSize: number;
  windowDays: number;
  checksum: string;
  attempts: number;
  threshold: number;
  cohort: string;
  status: PrimaryTicketViewReviewStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    externalRef: string,
    floorValue: number,
    batchSize: number,
    windowDays: number,
    checksum: string,
    attempts: number,
    threshold: number,
    cohort: string,
    status: PrimaryTicketViewReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.externalRef = externalRef;
    this.floorValue = floorValue;
    this.batchSize = batchSize;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.attempts = attempts;
    this.threshold = threshold;
    this.cohort = cohort;
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

  canMoveTo(next: PrimaryTicketViewReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryTicketViewReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary ticket view review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round((this.threshold + this.budget) * 100) / 100;
  }

  copy(): PrimaryTicketViewReview {
    return new PrimaryTicketViewReview(
      this.code,
      this.label,
      this.budget,
      this.externalRef,
      this.floorValue,
      this.batchSize,
      this.windowDays,
      this.checksum,
      this.attempts,
      this.threshold,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary ticket view review in status requested. */
export function newPrimaryTicketViewReview(code: string, label: string): PrimaryTicketViewReview {
  return new PrimaryTicketViewReview(code, label, 0, "", 0, 0, 0, "", 0, 0, "", "requested");
}
