/**
 * The paywall proposal records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall proposal is in its life cycle. */
export type PaywallProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A paywall proposal. Its code is unique within a tenant. */
export class PaywallProposal {
  code: string;
  label: string;
  revision: number;
  summary: string;
  score: number;
  status: PaywallProposalStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    summary: string,
    score: number,
    status: PaywallProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.summary = summary;
    this.score = score;
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

  canMoveTo(next: PaywallProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PaywallProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.score - this.revision) * 100) / 100;
  }

  copy(): PaywallProposal {
    return new PaywallProposal(this.code, this.label, this.revision, this.summary, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a paywall proposal in status open. */
export function newPaywallProposal(code: string, label: string): PaywallProposal {
  return new PaywallProposal(code, label, 0, "", 0, "open");
}
