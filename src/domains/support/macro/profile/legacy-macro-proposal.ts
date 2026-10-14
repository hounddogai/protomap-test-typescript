import * as text from "../../../../kit/text.js";

/** Where a legacy macro proposal is in its life cycle. */
export type LegacyMacroProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One legacy macro proposal, with what the planners need to act on it. */
export class LegacyMacroProposal {
  code: string;
  name: string;
  limit: number;
  threshold: number;
  bid: number;
  score: number;
  capacity: number;
  status: LegacyMacroProposalStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    threshold: number,
    bid: number,
    score: number,
    capacity: number,
    status: LegacyMacroProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.threshold = threshold;
    this.bid = bid;
    this.score = score;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyMacroProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyMacroProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy macro proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy macro proposal"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.score - this.limit) * 100) / 100;
  }

  copy(): LegacyMacroProposal {
    return new LegacyMacroProposal(
      this.code,
      this.name,
      this.limit,
      this.threshold,
      this.bid,
      this.score,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy macro proposal in status idle. */
export function newLegacyMacroProposal(code: string, name: string): LegacyMacroProposal {
  return new LegacyMacroProposal(code, name, 0, 0, 0, 0, 0, "idle");
}
