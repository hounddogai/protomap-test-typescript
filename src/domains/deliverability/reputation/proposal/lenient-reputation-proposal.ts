/**
 * The lenient reputation proposal records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient reputation proposal is in its life cycle. */
export type LenientReputationProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient reputation proposal. Its code is unique within a tenant. */
export class LenientReputationProposal {
  code: string;
  label: string;
  timezone: string;
  frequencyCap: number;
  amount: number;
  bid: number;
  status: LenientReputationProposalStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    frequencyCap: number,
    amount: number,
    bid: number,
    status: LenientReputationProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.amount = amount;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientReputationProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientReputationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reputation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.bid - this.frequencyCap) * 100) / 100;
  }

  copy(): LenientReputationProposal {
    return new LenientReputationProposal(
      this.code,
      this.label,
      this.timezone,
      this.frequencyCap,
      this.amount,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient reputation proposal in status open. */
export function newLenientReputationProposal(code: string, label: string): LenientReputationProposal {
  return new LenientReputationProposal(code, label, "", 0, 0, 0, "open");
}
