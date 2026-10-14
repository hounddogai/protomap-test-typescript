import * as text from "../../../../kit/text.js";

/** Where a adaptive reward rule proposal is in its life cycle. */
export type AdaptiveRewardRuleProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a adaptive reward rule proposal and its current status. */
export class AdaptiveRewardRuleProposal {
  code: string;
  name: string;
  bid: number;
  ownerId: string;
  clicks: number;
  campaignRef: string;
  unit: string;
  status: AdaptiveRewardRuleProposalStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    ownerId: string,
    clicks: number,
    campaignRef: string,
    unit: string,
    status: AdaptiveRewardRuleProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.ownerId = ownerId;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.unit = unit;
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

  canMoveTo(next: AdaptiveRewardRuleProposalStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveRewardRuleProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reward rule proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.bid + this.clicks) * 100) / 100;
  }

  copy(): AdaptiveRewardRuleProposal {
    return new AdaptiveRewardRuleProposal(
      this.code,
      this.name,
      this.bid,
      this.ownerId,
      this.clicks,
      this.campaignRef,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive reward rule proposal in status open. */
export function newAdaptiveRewardRuleProposal(code: string, name: string): AdaptiveRewardRuleProposal {
  return new AdaptiveRewardRuleProposal(code, name, 0, "", 0, "", "", "open");
}
