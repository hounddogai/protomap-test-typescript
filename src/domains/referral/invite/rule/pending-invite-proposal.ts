import * as text from "../../../../kit/text.js";

/** Where a pending invite proposal is in its life cycle. */
export type PendingInviteProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pending invite proposal and its current status. */
export class PendingInviteProposal {
  code: string;
  title: string;
  impressions: number;
  bid: number;
  reviewer: string;
  conversionRate: number;
  minimum: number;
  clicks: number;
  pinned: boolean;
  category: string;
  status: PendingInviteProposalStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    bid: number,
    reviewer: string,
    conversionRate: number,
    minimum: number,
    clicks: number,
    pinned: boolean,
    category: string,
    status: PendingInviteProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.bid = bid;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.minimum = minimum;
    this.clicks = clicks;
    this.pinned = pinned;
    this.category = category;
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

  canMoveTo(next: PendingInviteProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingInviteProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending invite proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending invite proposal"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.conversionRate + this.bid) * 100) / 100;
  }

  copy(): PendingInviteProposal {
    return new PendingInviteProposal(
      this.code,
      this.title,
      this.impressions,
      this.bid,
      this.reviewer,
      this.conversionRate,
      this.minimum,
      this.clicks,
      this.pinned,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending invite proposal in status idle. */
export function newPendingInviteProposal(code: string, title: string): PendingInviteProposal {
  return new PendingInviteProposal(code, title, 0, 0, "", 0, 0, 0, false, "", "idle");
}
