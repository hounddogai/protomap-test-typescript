/**
 * The weighted activation review records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted activation review is in its life cycle. */
export type WeightedActivationReviewStatus = "created" | "validated" | "published" | "retired";

/** One weighted activation review, with what the planners need to act on it. */
export class WeightedActivationReview {
  code: string;
  name: string;
  discount: number;
  bid: number;
  tags: string[];
  audienceId: string;
  status: WeightedActivationReviewStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    bid: number,
    tags: string[],
    audienceId: string,
    status: WeightedActivationReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.bid = bid;
    this.tags = tags;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedActivationReviewStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: WeightedActivationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted activation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted activation review"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round(this.bid * this.discount * 100) / 100;
  }

  copy(): WeightedActivationReview {
    return new WeightedActivationReview(
      this.code,
      this.name,
      this.discount,
      this.bid,
      this.tags,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted activation review in status created. */
export function newWeightedActivationReview(code: string, name: string): WeightedActivationReview {
  return new WeightedActivationReview(code, name, 0, 0, [], "", "created");
}
