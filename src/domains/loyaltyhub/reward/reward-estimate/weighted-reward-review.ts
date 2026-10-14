import * as text from "../../../../kit/text.js";

/** Where a weighted reward review is in its life cycle. */
export type WeightedRewardReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted reward review as the reward team keeps it. */
export class WeightedRewardReview {
  code: string;
  title: string;
  minimum: number;
  revision: number;
  checksum: string;
  status: WeightedRewardReviewStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    revision: number,
    checksum: string,
    status: WeightedRewardReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.revision = revision;
    this.checksum = checksum;
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

  canMoveTo(next: WeightedRewardReviewStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: WeightedRewardReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round(this.revision * this.minimum * 100) / 100;
  }

  copy(): WeightedRewardReview {
    return new WeightedRewardReview(this.code, this.title, this.minimum, this.revision, this.checksum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted reward review in status new. */
export function newWeightedRewardReview(code: string, title: string): WeightedRewardReview {
  return new WeightedRewardReview(code, title, 0, 0, "", "new");
}
