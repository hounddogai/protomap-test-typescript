import * as text from "../../../../kit/text.js";

/** Where a redemption segment is in its life cycle. */
export type RedemptionSegmentStatus = "created" | "validated" | "published" | "retired";

/** A redemption segment. Its code is unique within a tenant. */
export class RedemptionSegment {
  code: string;
  title: string;
  utmSource: string;
  sendAt: number;
  country: string;
  attempts: number;
  visible: boolean;
  channel: string;
  bid: number;
  status: RedemptionSegmentStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    sendAt: number,
    country: string,
    attempts: number,
    visible: boolean,
    channel: string,
    bid: number,
    status: RedemptionSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
    this.country = country;
    this.attempts = attempts;
    this.visible = visible;
    this.channel = channel;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.bid - this.sendAt) * 100) / 100;
  }

  copy(): RedemptionSegment {
    return new RedemptionSegment(
      this.code,
      this.title,
      this.utmSource,
      this.sendAt,
      this.country,
      this.attempts,
      this.visible,
      this.channel,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a redemption segment in status created. */
export function newRedemptionSegment(code: string, title: string): RedemptionSegment {
  return new RedemptionSegment(code, title, "", 0, "", 0, false, "", 0, "created");
}
