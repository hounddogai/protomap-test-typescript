/**
 * The pending bid rule segment records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending bid rule segment is in its life cycle. */
export type PendingBidRuleSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One pending bid rule segment, with what the planners need to act on it. */
export class PendingBidRuleSegment {
  code: string;
  title: string;
  journeyId: string;
  archived: boolean;
  impressions: number;
  batchSize: number;
  floorValue: number;
  revision: number;
  sendAt: number;
  channel: string;
  windowDays: number;
  status: PendingBidRuleSegmentStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    archived: boolean,
    impressions: number,
    batchSize: number,
    floorValue: number,
    revision: number,
    sendAt: number,
    channel: string,
    windowDays: number,
    status: PendingBidRuleSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.archived = archived;
    this.impressions = impressions;
    this.batchSize = batchSize;
    this.floorValue = floorValue;
    this.revision = revision;
    this.sendAt = sendAt;
    this.channel = channel;
    this.windowDays = windowDays;
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

  canMoveTo(next: PendingBidRuleSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingBidRuleSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bid rule segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.sendAt - this.batchSize) * 100) / 100;
  }

  copy(): PendingBidRuleSegment {
    return new PendingBidRuleSegment(
      this.code,
      this.title,
      this.journeyId,
      this.archived,
      this.impressions,
      this.batchSize,
      this.floorValue,
      this.revision,
      this.sendAt,
      this.channel,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending bid rule segment in status draft. */
export function newPendingBidRuleSegment(code: string, title: string): PendingBidRuleSegment {
  return new PendingBidRuleSegment(code, title, "", false, 0, 0, 0, 0, 0, "", 0, "draft");
}
