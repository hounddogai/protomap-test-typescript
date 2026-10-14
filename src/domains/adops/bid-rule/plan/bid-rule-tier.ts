import * as text from "../../../../kit/text.js";

/** Where a bid rule tier is in its life cycle. */
export type BidRuleTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One bid rule tier, with what the planners need to act on it. */
export class BidRuleTier {
  code: string;
  name: string;
  priority: number;
  budget: number;
  attempts: number;
  locale: string;
  category: string;
  impressions: number;
  status: BidRuleTierStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    budget: number,
    attempts: number,
    locale: string,
    category: string,
    impressions: number,
    status: BidRuleTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.budget = budget;
    this.attempts = attempts;
    this.locale = locale;
    this.category = category;
    this.impressions = impressions;
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

  canMoveTo(next: BidRuleTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BidRuleTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"bid rule tier"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.priority + this.attempts) * 100) / 100;
  }

  copy(): BidRuleTier {
    return new BidRuleTier(
      this.code,
      this.name,
      this.priority,
      this.budget,
      this.attempts,
      this.locale,
      this.category,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bid rule tier in status draft. */
export function newBidRuleTier(code: string, name: string): BidRuleTier {
  return new BidRuleTier(code, name, 0, 0, 0, "", "", 0, "draft");
}
