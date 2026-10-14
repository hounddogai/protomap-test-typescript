import * as text from "../../../../kit/text.js";

/** Where a tiered post review is in its life cycle. */
export type TieredPostReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered post review. Its code is unique within a tenant. */
export class TieredPostReview {
  code: string;
  title: string;
  locale: string;
  conversionRate: number;
  checksum: string;
  version: number;
  status: TieredPostReviewStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    conversionRate: number,
    checksum: string,
    version: number,
    status: TieredPostReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
    this.version = version;
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

  canMoveTo(next: TieredPostReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredPostReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered post review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"tiered post review"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.conversionRate * this.version * 100) / 100;
  }

  copy(): TieredPostReview {
    return new TieredPostReview(
      this.code,
      this.title,
      this.locale,
      this.conversionRate,
      this.checksum,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered post review in status idle. */
export function newTieredPostReview(code: string, title: string): TieredPostReview {
  return new TieredPostReview(code, title, "", 0, "", 0, "idle");
}
