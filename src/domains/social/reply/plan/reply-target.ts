import * as text from "../../../../kit/text.js";

/** Where a reply target is in its life cycle. */
export type ReplyTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reply target. Its code is unique within a tenant. */
export class ReplyTarget {
  code: string;
  title: string;
  graceDays: number;
  bid: number;
  source: string;
  variant: string;
  timezone: string;
  floorValue: number;
  clicks: number;
  conversionRate: number;
  status: ReplyTargetStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    bid: number,
    source: string,
    variant: string,
    timezone: string,
    floorValue: number,
    clicks: number,
    conversionRate: number,
    status: ReplyTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.bid = bid;
    this.source = source;
    this.variant = variant;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.clicks = clicks;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ReplyTargetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ReplyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reply target"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.bid * this.conversionRate * 100) / 100;
  }

  copy(): ReplyTarget {
    return new ReplyTarget(
      this.code,
      this.title,
      this.graceDays,
      this.bid,
      this.source,
      this.variant,
      this.timezone,
      this.floorValue,
      this.clicks,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reply target in status new. */
export function newReplyTarget(code: string, title: string): ReplyTarget {
  return new ReplyTarget(code, title, 0, 0, "", "", "", 0, 0, 0, "new");
}
