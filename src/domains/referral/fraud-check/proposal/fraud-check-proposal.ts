/**
 * The fraud check proposal records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check proposal is in its life cycle. */
export type FraudCheckProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fraud check proposal and its current status. */
export class FraudCheckProposal {
  code: string;
  label: string;
  batchSize: number;
  startsAt: number;
  clicks: number;
  status: FraudCheckProposalStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    startsAt: number,
    clicks: number,
    status: FraudCheckProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
    this.clicks = clicks;
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

  canMoveTo(next: FraudCheckProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.clicks - this.startsAt) * 100) / 100;
  }

  copy(): FraudCheckProposal {
    return new FraudCheckProposal(this.code, this.label, this.batchSize, this.startsAt, this.clicks, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check proposal in status open. */
export function newFraudCheckProposal(code: string, label: string): FraudCheckProposal {
  return new FraudCheckProposal(code, label, 0, 0, 0, "open");
}
