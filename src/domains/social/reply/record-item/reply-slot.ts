import * as text from "../../../../kit/text.js";

/** Where a reply slot is in its life cycle. */
export type ReplySlotStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a reply slot and its current status. */
export class ReplySlot {
  code: string;
  title: string;
  bid: number;
  source: string;
  checksum: string;
  floorValue: number;
  pinned: boolean;
  category: string;
  utmSource: string;
  timezone: string;
  threshold: number;
  status: ReplySlotStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    source: string,
    checksum: string,
    floorValue: number,
    pinned: boolean,
    category: string,
    utmSource: string,
    timezone: string,
    threshold: number,
    status: ReplySlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.source = source;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.category = category;
    this.utmSource = utmSource;
    this.timezone = timezone;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplySlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ReplySlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netVolume(): number {
    return Math.round(this.floorValue * this.threshold * 100) / 100;
  }

  copy(): ReplySlot {
    return new ReplySlot(
      this.code,
      this.title,
      this.bid,
      this.source,
      this.checksum,
      this.floorValue,
      this.pinned,
      this.category,
      this.utmSource,
      this.timezone,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reply slot in status requested. */
export function newReplySlot(code: string, title: string): ReplySlot {
  return new ReplySlot(code, title, 0, "", "", 0, false, "", "", "", 0, "requested");
}
