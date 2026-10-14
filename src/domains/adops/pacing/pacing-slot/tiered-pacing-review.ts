import * as text from "../../../../kit/text.js";

/** Where a tiered pacing review is in its life cycle. */
export type TieredPacingReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One tiered pacing review, with what the planners need to act on it. */
export class TieredPacingReview {
  code: string;
  name: string;
  conversionRate: number;
  discount: number;
  limit: number;
  threshold: number;
  channel: string;
  durationMinutes: number;
  status: TieredPacingReviewStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    discount: number,
    limit: number,
    threshold: number,
    channel: string,
    durationMinutes: number,
    status: TieredPacingReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.limit = limit;
    this.threshold = threshold;
    this.channel = channel;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: TieredPacingReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredPacingReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered pacing review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round(this.threshold * this.conversionRate * 100) / 100;
  }

  copy(): TieredPacingReview {
    return new TieredPacingReview(
      this.code,
      this.name,
      this.conversionRate,
      this.discount,
      this.limit,
      this.threshold,
      this.channel,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered pacing review in status requested. */
export function newTieredPacingReview(code: string, name: string): TieredPacingReview {
  return new TieredPacingReview(code, name, 0, 0, 0, 0, "", 0, "requested");
}
