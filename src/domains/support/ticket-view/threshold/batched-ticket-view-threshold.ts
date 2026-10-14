/**
 * The batched ticket view threshold records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched ticket view threshold is in its life cycle. */
export type BatchedTicketViewThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched ticket view threshold, with what the planners need to act on it. */
export class BatchedTicketViewThreshold {
  code: string;
  name: string;
  tags: string[];
  clicks: number;
  approved: boolean;
  ownerId: string;
  variant: string;
  bid: number;
  timezone: string;
  startsAt: number;
  externalRef: string;
  status: BatchedTicketViewThresholdStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    clicks: number,
    approved: boolean,
    ownerId: string,
    variant: string,
    bid: number,
    timezone: string,
    startsAt: number,
    externalRef: string,
    status: BatchedTicketViewThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.clicks = clicks;
    this.approved = approved;
    this.ownerId = ownerId;
    this.variant = variant;
    this.bid = bid;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
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

  canMoveTo(next: BatchedTicketViewThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedTicketViewThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched ticket view threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched ticket view threshold"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.startsAt * this.clicks * 100) / 100;
  }

  copy(): BatchedTicketViewThreshold {
    return new BatchedTicketViewThreshold(
      this.code,
      this.name,
      this.tags,
      this.clicks,
      this.approved,
      this.ownerId,
      this.variant,
      this.bid,
      this.timezone,
      this.startsAt,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched ticket view threshold in status new. */
export function newBatchedTicketViewThreshold(code: string, name: string): BatchedTicketViewThreshold {
  return new BatchedTicketViewThreshold(code, name, [], 0, false, "", "", 0, "", 0, "", "new");
}
