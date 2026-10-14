import * as text from "../../../../kit/text.js";

/** Where a lenient csat review is in its life cycle. */
export type LenientCsatReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient csat review and its current status. */
export class LenientCsatReview {
  code: string;
  label: string;
  audienceId: string;
  limit: number;
  bid: number;
  tags: string[];
  unit: string;
  ceiling: number;
  status: LenientCsatReviewStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    limit: number,
    bid: number,
    tags: string[],
    unit: string,
    ceiling: number,
    status: LenientCsatReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.limit = limit;
    this.bid = bid;
    this.tags = tags;
    this.unit = unit;
    this.ceiling = ceiling;
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

  canMoveTo(next: LenientCsatReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
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

  moveTo(next: LenientCsatReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient csat review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient csat review"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.limit + this.bid) * 100) / 100;
  }

  copy(): LenientCsatReview {
    return new LenientCsatReview(
      this.code,
      this.label,
      this.audienceId,
      this.limit,
      this.bid,
      this.tags,
      this.unit,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient csat review in status idle. */
export function newLenientCsatReview(code: string, label: string): LenientCsatReview {
  return new LenientCsatReview(code, label, "", 0, 0, [], "", 0, "idle");
}
