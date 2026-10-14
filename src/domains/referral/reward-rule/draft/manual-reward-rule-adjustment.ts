import * as text from "../../../../kit/text.js";

/** Where a manual reward rule adjustment is in its life cycle. */
export type ManualRewardRuleAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a manual reward rule adjustment and its current status. */
export class ManualRewardRuleAdjustment {
  code: string;
  name: string;
  budget: number;
  region: string;
  createdAt: number;
  durationMinutes: number;
  quantity: number;
  endsAt: number;
  status: ManualRewardRuleAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    region: string,
    createdAt: number,
    durationMinutes: number,
    quantity: number,
    endsAt: number,
    status: ManualRewardRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.region = region;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.quantity = quantity;
    this.endsAt = endsAt;
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

  canMoveTo(next: ManualRewardRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualRewardRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reward rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.quantity + this.budget) * 100) / 100;
  }

  copy(): ManualRewardRuleAdjustment {
    return new ManualRewardRuleAdjustment(
      this.code,
      this.name,
      this.budget,
      this.region,
      this.createdAt,
      this.durationMinutes,
      this.quantity,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a manual reward rule adjustment in status open. */
export function newManualRewardRuleAdjustment(code: string, name: string): ManualRewardRuleAdjustment {
  return new ManualRewardRuleAdjustment(code, name, 0, "", 0, 0, 0, 0, "open");
}
