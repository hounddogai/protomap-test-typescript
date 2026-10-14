import * as text from "../../../../kit/text.js";

/** Where a manual reward review is in its life cycle. */
export type ManualRewardReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual reward review. Its code is unique within a tenant. */
export class ManualRewardReview {
  code: string;
  name: string;
  tags: string[];
  reviewer: string;
  budget: number;
  updatedAt: number;
  locale: string;
  ownerId: string;
  timezone: string;
  cost: number;
  status: ManualRewardReviewStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    reviewer: string,
    budget: number,
    updatedAt: number,
    locale: string,
    ownerId: string,
    timezone: string,
    cost: number,
    status: ManualRewardReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.reviewer = reviewer;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualRewardReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRewardReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reward review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.updatedAt - this.budget) * 100) / 100;
  }

  copy(): ManualRewardReview {
    return new ManualRewardReview(
      this.code,
      this.name,
      this.tags,
      this.reviewer,
      this.budget,
      this.updatedAt,
      this.locale,
      this.ownerId,
      this.timezone,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual reward review in status draft. */
export function newManualRewardReview(code: string, name: string): ManualRewardReview {
  return new ManualRewardReview(code, name, [], "", 0, 0, "", "", "", 0, "draft");
}
