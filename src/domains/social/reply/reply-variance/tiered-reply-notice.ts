import * as text from "../../../../kit/text.js";

/** Where a tiered reply notice is in its life cycle. */
export type TieredReplyNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a tiered reply notice and its current status. */
export class TieredReplyNotice {
  code: string;
  label: string;
  category: string;
  impressions: number;
  openRate: number;
  threshold: number;
  reviewer: string;
  archived: boolean;
  bid: number;
  ownerId: string;
  status: TieredReplyNoticeStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    impressions: number,
    openRate: number,
    threshold: number,
    reviewer: string,
    archived: boolean,
    bid: number,
    ownerId: string,
    status: TieredReplyNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.impressions = impressions;
    this.openRate = openRate;
    this.threshold = threshold;
    this.reviewer = reviewer;
    this.archived = archived;
    this.bid = bid;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredReplyNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredReplyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reply notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.bid * this.openRate * 100) / 100;
  }

  copy(): TieredReplyNotice {
    return new TieredReplyNotice(
      this.code,
      this.label,
      this.category,
      this.impressions,
      this.openRate,
      this.threshold,
      this.reviewer,
      this.archived,
      this.bid,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered reply notice in status new. */
export function newTieredReplyNotice(code: string, label: string): TieredReplyNotice {
  return new TieredReplyNotice(code, label, "", 0, 0, 0, "", false, 0, "", "new");
}
