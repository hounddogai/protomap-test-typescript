import * as text from "../../../../kit/text.js";

/** Where a fallback reward review is in its life cycle. */
export type FallbackRewardReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback reward review as the reward team keeps it. */
export class FallbackRewardReview {
  code: string;
  name: string;
  region: string;
  batchSize: number;
  openRate: number;
  country: string;
  frequencyCap: number;
  journeyId: string;
  endsAt: number;
  status: FallbackRewardReviewStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    batchSize: number,
    openRate: number,
    country: string,
    frequencyCap: number,
    journeyId: string,
    endsAt: number,
    status: FallbackRewardReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.batchSize = batchSize;
    this.openRate = openRate;
    this.country = country;
    this.frequencyCap = frequencyCap;
    this.journeyId = journeyId;
    this.endsAt = endsAt;
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

  canMoveTo(next: FallbackRewardReviewStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackRewardReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.openRate * this.frequencyCap * 100) / 100;
  }

  copy(): FallbackRewardReview {
    return new FallbackRewardReview(
      this.code,
      this.name,
      this.region,
      this.batchSize,
      this.openRate,
      this.country,
      this.frequencyCap,
      this.journeyId,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fallback reward review in status new. */
export function newFallbackRewardReview(code: string, name: string): FallbackRewardReview {
  return new FallbackRewardReview(code, name, "", 0, 0, "", 0, "", 0, "new");
}
