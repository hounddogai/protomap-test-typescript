import * as text from "../../../../kit/text.js";

/** Where a default reply proposal is in its life cycle. */
export type DefaultReplyProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One default reply proposal, with what the planners need to act on it. */
export class DefaultReplyProposal {
  code: string;
  name: string;
  impressions: number;
  expiresAt: number;
  label: string;
  segment: string;
  conversionRate: number;
  status: DefaultReplyProposalStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    expiresAt: number,
    label: string,
    segment: string,
    conversionRate: number,
    status: DefaultReplyProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.expiresAt = expiresAt;
    this.label = label;
    this.segment = segment;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: DefaultReplyProposalStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultReplyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default reply proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default reply proposal"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.conversionRate * this.expiresAt * 100) / 100;
  }

  copy(): DefaultReplyProposal {
    return new DefaultReplyProposal(
      this.code,
      this.name,
      this.impressions,
      this.expiresAt,
      this.label,
      this.segment,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default reply proposal in status open. */
export function newDefaultReplyProposal(code: string, name: string): DefaultReplyProposal {
  return new DefaultReplyProposal(code, name, 0, 0, "", "", 0, "open");
}
