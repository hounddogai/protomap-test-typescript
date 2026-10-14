import * as text from "../../../../kit/text.js";

/** Where a adaptive queue proposal is in its life cycle. */
export type AdaptiveQueueProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One adaptive queue proposal, with what the planners need to act on it. */
export class AdaptiveQueueProposal {
  code: string;
  label: string;
  country: string;
  budget: number;
  impressions: number;
  rate: number;
  status: AdaptiveQueueProposalStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    budget: number,
    impressions: number,
    rate: number,
    status: AdaptiveQueueProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.budget = budget;
    this.impressions = impressions;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveQueueProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveQueueProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive queue proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.impressions + this.budget) * 100) / 100;
  }

  copy(): AdaptiveQueueProposal {
    return new AdaptiveQueueProposal(
      this.code,
      this.label,
      this.country,
      this.budget,
      this.impressions,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive queue proposal in status draft. */
export function newAdaptiveQueueProposal(code: string, label: string): AdaptiveQueueProposal {
  return new AdaptiveQueueProposal(code, label, "", 0, 0, 0, "draft");
}
