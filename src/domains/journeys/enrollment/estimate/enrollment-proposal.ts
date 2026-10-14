import * as text from "../../../../kit/text.js";

/** Where a enrollment proposal is in its life cycle. */
export type EnrollmentProposalStatus = "created" | "validated" | "published" | "retired";

/** A enrollment proposal as the enrollment team keeps it. */
export class EnrollmentProposal {
  code: string;
  name: string;
  windowDays: number;
  bid: number;
  conversionRate: number;
  pinned: boolean;
  currency: string;
  threshold: number;
  status: EnrollmentProposalStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    bid: number,
    conversionRate: number,
    pinned: boolean,
    currency: string,
    threshold: number,
    status: EnrollmentProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.bid = bid;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.currency = currency;
    this.threshold = threshold;
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

  canMoveTo(next: EnrollmentProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: EnrollmentProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"enrollment proposal"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.conversionRate * this.threshold * 100) / 100;
  }

  copy(): EnrollmentProposal {
    return new EnrollmentProposal(
      this.code,
      this.name,
      this.windowDays,
      this.bid,
      this.conversionRate,
      this.pinned,
      this.currency,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a enrollment proposal in status created. */
export function newEnrollmentProposal(code: string, name: string): EnrollmentProposal {
  return new EnrollmentProposal(code, name, 0, 0, 0, false, "", 0, "created");
}
