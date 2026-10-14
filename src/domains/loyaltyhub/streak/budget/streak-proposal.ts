import * as text from "../../../../kit/text.js";

/** Where a streak proposal is in its life cycle. */
export type StreakProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A streak proposal as the streak team keeps it. */
export class StreakProposal {
  code: string;
  name: string;
  rate: number;
  budget: number;
  segment: string;
  status: StreakProposalStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    budget: number,
    segment: string,
    status: StreakProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.budget = budget;
    this.segment = segment;
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

  canMoveTo(next: StreakProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: StreakProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.budget + this.rate) * 100) / 100;
  }

  copy(): StreakProposal {
    return new StreakProposal(this.code, this.name, this.rate, this.budget, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a streak proposal in status proposed. */
export function newStreakProposal(code: string, name: string): StreakProposal {
  return new StreakProposal(code, name, 0, 0, "", "proposed");
}
