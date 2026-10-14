import * as text from "../../../../kit/text.js";

/** Where a weighted redemption proposal is in its life cycle. */
export type WeightedRedemptionProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One weighted redemption proposal, with what the planners need to act on it. */
export class WeightedRedemptionProposal {
  code: string;
  label: string;
  channel: string;
  summary: string;
  campaignRef: string;
  score: number;
  status: WeightedRedemptionProposalStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    summary: string,
    campaignRef: string,
    score: number,
    status: WeightedRedemptionProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.summary = summary;
    this.campaignRef = campaignRef;
    this.score = score;
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

  canMoveTo(next: WeightedRedemptionProposalStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedRedemptionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted redemption proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): WeightedRedemptionProposal {
    return new WeightedRedemptionProposal(
      this.code,
      this.label,
      this.channel,
      this.summary,
      this.campaignRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted redemption proposal in status open. */
export function newWeightedRedemptionProposal(code: string, label: string): WeightedRedemptionProposal {
  return new WeightedRedemptionProposal(code, label, "", "", "", 0, "open");
}
