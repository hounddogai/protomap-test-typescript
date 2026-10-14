import * as text from "../../../../kit/text.js";

/** Where a tiered reward rule adjustment is in its life cycle. */
export type TieredRewardRuleAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered reward rule adjustment as the reward rule team keeps it. */
export class TieredRewardRuleAdjustment {
  code: string;
  title: string;
  impressions: number;
  durationMinutes: number;
  retries: number;
  budget: number;
  threshold: number;
  quantity: number;
  active: boolean;
  startsAt: number;
  pinned: boolean;
  status: TieredRewardRuleAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    durationMinutes: number,
    retries: number,
    budget: number,
    threshold: number,
    quantity: number,
    active: boolean,
    startsAt: number,
    pinned: boolean,
    status: TieredRewardRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.durationMinutes = durationMinutes;
    this.retries = retries;
    this.budget = budget;
    this.threshold = threshold;
    this.quantity = quantity;
    this.active = active;
    this.startsAt = startsAt;
    this.pinned = pinned;
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

  canMoveTo(next: TieredRewardRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredRewardRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered reward rule adjustment"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.durationMinutes - this.retries) * 100) / 100;
  }

  copy(): TieredRewardRuleAdjustment {
    return new TieredRewardRuleAdjustment(
      this.code,
      this.title,
      this.impressions,
      this.durationMinutes,
      this.retries,
      this.budget,
      this.threshold,
      this.quantity,
      this.active,
      this.startsAt,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered reward rule adjustment in status draft. */
export function newTieredRewardRuleAdjustment(code: string, title: string): TieredRewardRuleAdjustment {
  return new TieredRewardRuleAdjustment(code, title, 0, 0, 0, 0, 0, 0, false, 0, false, "draft");
}
