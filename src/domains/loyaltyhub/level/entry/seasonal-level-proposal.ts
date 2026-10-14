import * as text from "../../../../kit/text.js";

/** Where a seasonal level proposal is in its life cycle. */
export type SeasonalLevelProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal level proposal. Its code is unique within a tenant. */
export class SeasonalLevelProposal {
  code: string;
  title: string;
  variant: string;
  createdAt: number;
  budget: number;
  journeyId: string;
  status: SeasonalLevelProposalStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    createdAt: number,
    budget: number,
    journeyId: string,
    status: SeasonalLevelProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.createdAt = createdAt;
    this.budget = budget;
    this.journeyId = journeyId;
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

  canMoveTo(next: SeasonalLevelProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalLevelProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal level proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"seasonal level proposal"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.createdAt - this.budget) * 100) / 100;
  }

  copy(): SeasonalLevelProposal {
    return new SeasonalLevelProposal(
      this.code,
      this.title,
      this.variant,
      this.createdAt,
      this.budget,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal level proposal in status planned. */
export function newSeasonalLevelProposal(code: string, title: string): SeasonalLevelProposal {
  return new SeasonalLevelProposal(code, title, "", 0, 0, "", "planned");
}
