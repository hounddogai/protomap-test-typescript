import * as text from "../../../../kit/text.js";

/** Where a bounce proposal is in its life cycle. */
export type BounceProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a bounce proposal and its current status. */
export class BounceProposal {
  code: string;
  label: string;
  limit: number;
  rate: number;
  bid: number;
  category: string;
  status: BounceProposalStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    rate: number,
    bid: number,
    category: string,
    status: BounceProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.rate = rate;
    this.bid = bid;
    this.category = category;
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

  canMoveTo(next: BounceProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
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

  moveTo(next: BounceProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.limit * this.rate * 100) / 100;
  }

  copy(): BounceProposal {
    return new BounceProposal(this.code, this.label, this.limit, this.rate, this.bid, this.category, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bounce proposal in status planned. */
export function newBounceProposal(code: string, label: string): BounceProposal {
  return new BounceProposal(code, label, 0, 0, 0, "", "planned");
}
