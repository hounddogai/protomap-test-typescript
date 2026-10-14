/**
 * The global challenge proposal records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global challenge proposal is in its life cycle. */
export type GlobalChallengeProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global challenge proposal, with what the planners need to act on it. */
export class GlobalChallengeProposal {
  code: string;
  name: string;
  reviewer: string;
  unit: string;
  ratio: number;
  budget: number;
  startsAt: number;
  status: GlobalChallengeProposalStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    unit: string,
    ratio: number,
    budget: number,
    startsAt: number,
    status: GlobalChallengeProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.unit = unit;
    this.ratio = ratio;
    this.budget = budget;
    this.startsAt = startsAt;
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

  canMoveTo(next: GlobalChallengeProposalStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalChallengeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global challenge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round(this.budget * this.startsAt * 100) / 100;
  }

  copy(): GlobalChallengeProposal {
    return new GlobalChallengeProposal(
      this.code,
      this.name,
      this.reviewer,
      this.unit,
      this.ratio,
      this.budget,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global challenge proposal in status open. */
export function newGlobalChallengeProposal(code: string, name: string): GlobalChallengeProposal {
  return new GlobalChallengeProposal(code, name, "", "", 0, 0, 0, "open");
}
