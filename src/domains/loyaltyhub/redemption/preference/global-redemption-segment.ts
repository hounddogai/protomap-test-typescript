import * as text from "../../../../kit/text.js";

/** Where a global redemption segment is in its life cycle. */
export type GlobalRedemptionSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global redemption segment as the redemption team keeps it. */
export class GlobalRedemptionSegment {
  code: string;
  title: string;
  endsAt: number;
  budget: number;
  quantity: number;
  batchSize: number;
  retries: number;
  source: string;
  channel: string;
  checksum: string;
  threshold: number;
  status: GlobalRedemptionSegmentStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    budget: number,
    quantity: number,
    batchSize: number,
    retries: number,
    source: string,
    channel: string,
    checksum: string,
    threshold: number,
    status: GlobalRedemptionSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.budget = budget;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.retries = retries;
    this.source = source;
    this.channel = channel;
    this.checksum = checksum;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalRedemptionSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalRedemptionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global redemption segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.threshold + this.batchSize) * 100) / 100;
  }

  copy(): GlobalRedemptionSegment {
    return new GlobalRedemptionSegment(
      this.code,
      this.title,
      this.endsAt,
      this.budget,
      this.quantity,
      this.batchSize,
      this.retries,
      this.source,
      this.channel,
      this.checksum,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global redemption segment in status planned. */
export function newGlobalRedemptionSegment(code: string, title: string): GlobalRedemptionSegment {
  return new GlobalRedemptionSegment(code, title, 0, 0, 0, 0, 0, "", "", "", 0, "planned");
}
