import * as text from "../../../../kit/text.js";

/** Where a weighted mention review is in its life cycle. */
export type WeightedMentionReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted mention review as the mention team keeps it. */
export class WeightedMentionReview {
  code: string;
  name: string;
  cost: number;
  expiresAt: number;
  currency: string;
  createdAt: number;
  capacity: number;
  ownerId: string;
  status: WeightedMentionReviewStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    expiresAt: number,
    currency: string,
    createdAt: number,
    capacity: number,
    ownerId: string,
    status: WeightedMentionReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedMentionReviewStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedMentionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted mention review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted mention review"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.expiresAt * this.capacity * 100) / 100;
  }

  copy(): WeightedMentionReview {
    return new WeightedMentionReview(
      this.code,
      this.name,
      this.cost,
      this.expiresAt,
      this.currency,
      this.createdAt,
      this.capacity,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted mention review in status open. */
export function newWeightedMentionReview(code: string, name: string): WeightedMentionReview {
  return new WeightedMentionReview(code, name, 0, 0, "", 0, 0, "", "open");
}
