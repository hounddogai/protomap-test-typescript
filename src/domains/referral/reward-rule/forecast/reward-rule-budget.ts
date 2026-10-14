import * as text from "../../../../kit/text.js";

/** Where a reward rule budget is in its life cycle. */
export type RewardRuleBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reward rule budget. Its code is unique within a tenant. */
export class RewardRuleBudget {
  code: string;
  label: string;
  budget: number;
  approved: boolean;
  floorValue: number;
  ratio: number;
  reviewer: string;
  weight: number;
  version: number;
  channel: string;
  status: RewardRuleBudgetStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    approved: boolean,
    floorValue: number,
    ratio: number,
    reviewer: string,
    weight: number,
    version: number,
    channel: string,
    status: RewardRuleBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.approved = approved;
    this.floorValue = floorValue;
    this.ratio = ratio;
    this.reviewer = reviewer;
    this.weight = weight;
    this.version = version;
    this.channel = channel;
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

  canMoveTo(next: RewardRuleBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RewardRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.weight - this.floorValue) * 100) / 100;
  }

  copy(): RewardRuleBudget {
    return new RewardRuleBudget(
      this.code,
      this.label,
      this.budget,
      this.approved,
      this.floorValue,
      this.ratio,
      this.reviewer,
      this.weight,
      this.version,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reward rule budget in status draft. */
export function newRewardRuleBudget(code: string, label: string): RewardRuleBudget {
  return new RewardRuleBudget(code, label, 0, false, 0, 0, "", 0, 0, "", "draft");
}
