import * as text from "../../../../kit/text.js";

/** Where a tier segment is in its life cycle. */
export type TierSegmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tier segment as the tier team keeps it. */
export class TierSegment {
  code: string;
  title: string;
  createdAt: number;
  discount: number;
  maximum: number;
  windowDays: number;
  tags: string[];
  threshold: number;
  status: TierSegmentStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    discount: number,
    maximum: number,
    windowDays: number,
    tags: string[],
    threshold: number,
    status: TierSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.discount = discount;
    this.maximum = maximum;
    this.windowDays = windowDays;
    this.tags = tags;
    this.threshold = threshold;
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

  canMoveTo(next: TierSegmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tier segment"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.maximum + this.createdAt) * 100) / 100;
  }

  copy(): TierSegment {
    return new TierSegment(
      this.code,
      this.title,
      this.createdAt,
      this.discount,
      this.maximum,
      this.windowDays,
      this.tags,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tier segment in status new. */
export function newTierSegment(code: string, title: string): TierSegment {
  return new TierSegment(code, title, 0, 0, 0, 0, [], 0, "new");
}
