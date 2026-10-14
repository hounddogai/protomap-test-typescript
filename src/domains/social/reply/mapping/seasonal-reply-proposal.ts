import * as text from "../../../../kit/text.js";

/** Where a seasonal reply proposal is in its life cycle. */
export type SeasonalReplyProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal reply proposal as the reply team keeps it. */
export class SeasonalReplyProposal {
  code: string;
  label: string;
  amount: number;
  retries: number;
  ratio: number;
  status: SeasonalReplyProposalStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    retries: number,
    ratio: number,
    status: SeasonalReplyProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.retries = retries;
    this.ratio = ratio;
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

  canMoveTo(next: SeasonalReplyProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalReplyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reply proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.ratio + this.retries) * 100) / 100;
  }

  copy(): SeasonalReplyProposal {
    return new SeasonalReplyProposal(this.code, this.label, this.amount, this.retries, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal reply proposal in status planned. */
export function newSeasonalReplyProposal(code: string, label: string): SeasonalReplyProposal {
  return new SeasonalReplyProposal(code, label, 0, 0, 0, "planned");
}
