import * as text from "../../../../kit/text.js";

/** Where a bid rule exception is in its life cycle. */
export type BidRuleExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One bid rule exception, with what the planners need to act on it. */
export class BidRuleException {
  code: string;
  label: string;
  frequencyCap: number;
  approved: boolean;
  reviewer: string;
  contactEmail: string;
  status: BidRuleExceptionStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    approved: boolean,
    reviewer: string,
    contactEmail: string,
    status: BidRuleExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.approved = approved;
    this.reviewer = reviewer;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: BidRuleExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): BidRuleException {
    return new BidRuleException(
      this.code,
      this.label,
      this.frequencyCap,
      this.approved,
      this.reviewer,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule exception in status planned. */
export function newBidRuleException(code: string, label: string): BidRuleException {
  return new BidRuleException(code, label, 0, false, "", "", "planned");
}
