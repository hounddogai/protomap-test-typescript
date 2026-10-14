import * as text from "../../../../kit/text.js";

/** Where a lenient mention segment is in its life cycle. */
export type LenientMentionSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient mention segment and its current status. */
export class LenientMentionSegment {
  code: string;
  title: string;
  weight: number;
  externalRef: string;
  campaignRef: string;
  threshold: number;
  region: string;
  cost: number;
  rate: number;
  sendAt: number;
  discount: number;
  status: LenientMentionSegmentStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    externalRef: string,
    campaignRef: string,
    threshold: number,
    region: string,
    cost: number,
    rate: number,
    sendAt: number,
    discount: number,
    status: LenientMentionSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.threshold = threshold;
    this.region = region;
    this.cost = cost;
    this.rate = rate;
    this.sendAt = sendAt;
    this.discount = discount;
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

  canMoveTo(next: LenientMentionSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientMentionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient mention segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.rate + this.threshold) * 100) / 100;
  }

  copy(): LenientMentionSegment {
    return new LenientMentionSegment(
      this.code,
      this.title,
      this.weight,
      this.externalRef,
      this.campaignRef,
      this.threshold,
      this.region,
      this.cost,
      this.rate,
      this.sendAt,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient mention segment in status idle. */
export function newLenientMentionSegment(code: string, title: string): LenientMentionSegment {
  return new LenientMentionSegment(code, title, 0, "", "", 0, "", 0, 0, 0, 0, "idle");
}
