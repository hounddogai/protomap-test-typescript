import * as text from "../../../../kit/text.js";

/** Where a strict redemption policy is in its life cycle. */
export type StrictRedemptionPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a strict redemption policy and its current status. */
export class StrictRedemptionPolicy {
  code: string;
  title: string;
  createdAt: number;
  currency: string;
  category: string;
  version: number;
  windowDays: number;
  score: number;
  ownerId: string;
  status: StrictRedemptionPolicyStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    currency: string,
    category: string,
    version: number,
    windowDays: number,
    score: number,
    ownerId: string,
    status: StrictRedemptionPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.currency = currency;
    this.category = category;
    this.version = version;
    this.windowDays = windowDays;
    this.score = score;
    this.ownerId = ownerId;
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

  canMoveTo(next: StrictRedemptionPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
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

  moveTo(next: StrictRedemptionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict redemption policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.score * this.version * 100) / 100;
  }

  copy(): StrictRedemptionPolicy {
    return new StrictRedemptionPolicy(
      this.code,
      this.title,
      this.createdAt,
      this.currency,
      this.category,
      this.version,
      this.windowDays,
      this.score,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict redemption policy in status draft. */
export function newStrictRedemptionPolicy(code: string, title: string): StrictRedemptionPolicy {
  return new StrictRedemptionPolicy(code, title, 0, "", "", 0, 0, 0, "", "draft");
}
