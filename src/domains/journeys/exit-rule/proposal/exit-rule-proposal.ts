/**
 * The exit rule proposal records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule proposal is in its life cycle. */
export type ExitRuleProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One exit rule proposal, with what the planners need to act on it. */
export class ExitRuleProposal {
  code: string;
  name: string;
  priority: number;
  contactEmail: string;
  cohort: string;
  status: ExitRuleProposalStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    contactEmail: string,
    cohort: string,
    status: ExitRuleProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
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

  canMoveTo(next: ExitRuleProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): ExitRuleProposal {
    return new ExitRuleProposal(this.code, this.name, this.priority, this.contactEmail, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a exit rule proposal in status proposed. */
export function newExitRuleProposal(code: string, name: string): ExitRuleProposal {
  return new ExitRuleProposal(code, name, 0, "", "", "proposed");
}
