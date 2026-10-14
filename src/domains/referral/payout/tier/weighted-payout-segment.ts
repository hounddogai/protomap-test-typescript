import * as text from "../../../../kit/text.js";

/** Where a weighted payout segment is in its life cycle. */
export type WeightedPayoutSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a weighted payout segment and its current status. */
export class WeightedPayoutSegment {
  code: string;
  title: string;
  updatedAt: number;
  priority: number;
  segment: string;
  checksum: string;
  graceDays: number;
  bid: number;
  sendAt: number;
  revision: number;
  margin: number;
  status: WeightedPayoutSegmentStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    priority: number,
    segment: string,
    checksum: string,
    graceDays: number,
    bid: number,
    sendAt: number,
    revision: number,
    margin: number,
    status: WeightedPayoutSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.priority = priority;
    this.segment = segment;
    this.checksum = checksum;
    this.graceDays = graceDays;
    this.bid = bid;
    this.sendAt = sendAt;
    this.revision = revision;
    this.margin = margin;
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

  canMoveTo(next: WeightedPayoutSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPayoutSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted payout segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.margin * this.priority * 100) / 100;
  }

  copy(): WeightedPayoutSegment {
    return new WeightedPayoutSegment(
      this.code,
      this.title,
      this.updatedAt,
      this.priority,
      this.segment,
      this.checksum,
      this.graceDays,
      this.bid,
      this.sendAt,
      this.revision,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted payout segment in status requested. */
export function newWeightedPayoutSegment(code: string, title: string): WeightedPayoutSegment {
  return new WeightedPayoutSegment(code, title, 0, 0, "", "", 0, 0, 0, 0, 0, "requested");
}
