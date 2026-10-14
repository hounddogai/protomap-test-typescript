import * as text from "../../../../kit/text.js";

/** Where a bid rule preference is in its life cycle. */
export type BidRulePreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a bid rule preference and its current status. */
export class BidRulePreference {
  code: string;
  title: string;
  updatedAt: number;
  category: string;
  capacity: number;
  cost: number;
  visible: boolean;
  attempts: number;
  country: string;
  batchSize: number;
  status: BidRulePreferenceStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    category: string,
    capacity: number,
    cost: number,
    visible: boolean,
    attempts: number,
    country: string,
    batchSize: number,
    status: BidRulePreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.category = category;
    this.capacity = capacity;
    this.cost = cost;
    this.visible = visible;
    this.attempts = attempts;
    this.country = country;
    this.batchSize = batchSize;
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

  canMoveTo(next: BidRulePreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BidRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"bid rule preference"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.capacity + this.cost) * 100) / 100;
  }

  copy(): BidRulePreference {
    return new BidRulePreference(
      this.code,
      this.title,
      this.updatedAt,
      this.category,
      this.capacity,
      this.cost,
      this.visible,
      this.attempts,
      this.country,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bid rule preference in status requested. */
export function newBidRulePreference(code: string, title: string): BidRulePreference {
  return new BidRulePreference(code, title, 0, "", 0, 0, false, 0, "", 0, "requested");
}
