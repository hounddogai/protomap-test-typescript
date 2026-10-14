import * as text from "../../../../kit/text.js";

/** Where a reputation review is in its life cycle. */
export type ReputationReviewStatus = "created" | "validated" | "published" | "retired";

/** A reputation review as the reputation team keeps it. */
export class ReputationReview {
  code: string;
  name: string;
  impressions: number;
  windowDays: number;
  segment: string;
  clicks: number;
  openRate: number;
  locale: string;
  floorValue: number;
  bid: number;
  ratio: number;
  status: ReputationReviewStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    windowDays: number,
    segment: string,
    clicks: number,
    openRate: number,
    locale: string,
    floorValue: number,
    bid: number,
    ratio: number,
    status: ReputationReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.segment = segment;
    this.clicks = clicks;
    this.openRate = openRate;
    this.locale = locale;
    this.floorValue = floorValue;
    this.bid = bid;
    this.ratio = ratio;
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

  canMoveTo(next: ReputationReviewStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: ReputationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.clicks + this.openRate) * 100) / 100;
  }

  copy(): ReputationReview {
    return new ReputationReview(
      this.code,
      this.name,
      this.impressions,
      this.windowDays,
      this.segment,
      this.clicks,
      this.openRate,
      this.locale,
      this.floorValue,
      this.bid,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reputation review in status created. */
export function newReputationReview(code: string, name: string): ReputationReview {
  return new ReputationReview(code, name, 0, 0, "", 0, 0, "", 0, 0, 0, "created");
}
