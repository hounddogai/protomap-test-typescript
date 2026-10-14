import * as text from "../../../../kit/text.js";

/** Where a weighted exit rule cycle is in its life cycle. */
export type WeightedExitRuleCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted exit rule cycle. Its code is unique within a tenant. */
export class WeightedExitRuleCycle {
  code: string;
  title: string;
  rate: number;
  budget: number;
  createdAt: number;
  status: WeightedExitRuleCycleStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    budget: number,
    createdAt: number,
    status: WeightedExitRuleCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.budget = budget;
    this.createdAt = createdAt;
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

  canMoveTo(next: WeightedExitRuleCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
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

  moveTo(next: WeightedExitRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted exit rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted exit rule cycle"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.rate + this.budget) * 100) / 100;
  }

  copy(): WeightedExitRuleCycle {
    return new WeightedExitRuleCycle(this.code, this.title, this.rate, this.budget, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted exit rule cycle in status draft. */
export function newWeightedExitRuleCycle(code: string, title: string): WeightedExitRuleCycle {
  return new WeightedExitRuleCycle(code, title, 0, 0, 0, "draft");
}
