import * as text from "../../../../kit/text.js";

/** Where a reward proposal is in its life cycle. */
export type RewardProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reward proposal, with what the planners need to act on it. */
export class RewardProposal {
  code: string;
  name: string;
  discount: number;
  variant: string;
  reviewer: string;
  graceDays: number;
  label: string;
  status: RewardProposalStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    variant: string,
    reviewer: string,
    graceDays: number,
    label: string,
    status: RewardProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.variant = variant;
    this.reviewer = reviewer;
    this.graceDays = graceDays;
    this.label = label;
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

  canMoveTo(next: RewardProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
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

  moveTo(next: RewardProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.graceDays * this.discount * 100) / 100;
  }

  copy(): RewardProposal {
    return new RewardProposal(
      this.code,
      this.name,
      this.discount,
      this.variant,
      this.reviewer,
      this.graceDays,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward proposal in status proposed. */
export function newRewardProposal(code: string, name: string): RewardProposal {
  return new RewardProposal(code, name, 0, "", "", 0, "", "proposed");
}
