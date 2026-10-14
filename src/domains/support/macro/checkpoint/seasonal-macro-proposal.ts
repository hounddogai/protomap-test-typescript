import * as text from "../../../../kit/text.js";

/** Where a seasonal macro proposal is in its life cycle. */
export type SeasonalMacroProposalStatus = "created" | "validated" | "published" | "retired";

/** One seasonal macro proposal, with what the planners need to act on it. */
export class SeasonalMacroProposal {
  code: string;
  name: string;
  minimum: number;
  budget: number;
  country: string;
  channel: string;
  expiresAt: number;
  status: SeasonalMacroProposalStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    budget: number,
    country: string,
    channel: string,
    expiresAt: number,
    status: SeasonalMacroProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.budget = budget;
    this.country = country;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalMacroProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SeasonalMacroProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal macro proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.minimum - this.expiresAt) * 100) / 100;
  }

  copy(): SeasonalMacroProposal {
    return new SeasonalMacroProposal(
      this.code,
      this.name,
      this.minimum,
      this.budget,
      this.country,
      this.channel,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal macro proposal in status created. */
export function newSeasonalMacroProposal(code: string, name: string): SeasonalMacroProposal {
  return new SeasonalMacroProposal(code, name, 0, 0, "", "", 0, "created");
}
