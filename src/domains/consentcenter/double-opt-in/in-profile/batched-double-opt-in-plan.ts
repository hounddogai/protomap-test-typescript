import * as text from "../../../../kit/text.js";

/** Where a batched double opt in plan is in its life cycle. */
export type BatchedDoubleOptInPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched double opt in plan as the double opt in team keeps it. */
export class BatchedDoubleOptInPlan {
  code: string;
  name: string;
  score: number;
  version: number;
  frequencyCap: number;
  segment: string;
  conversionRate: number;
  budget: number;
  cost: number;
  status: BatchedDoubleOptInPlanStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    version: number,
    frequencyCap: number,
    segment: string,
    conversionRate: number,
    budget: number,
    cost: number,
    status: BatchedDoubleOptInPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.version = version;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.conversionRate = conversionRate;
    this.budget = budget;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedDoubleOptInPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedDoubleOptInPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched double opt in plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"batched double opt in plan"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.cost * this.budget * 100) / 100;
  }

  copy(): BatchedDoubleOptInPlan {
    return new BatchedDoubleOptInPlan(
      this.code,
      this.name,
      this.score,
      this.version,
      this.frequencyCap,
      this.segment,
      this.conversionRate,
      this.budget,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched double opt in plan in status idle. */
export function newBatchedDoubleOptInPlan(code: string, name: string): BatchedDoubleOptInPlan {
  return new BatchedDoubleOptInPlan(code, name, 0, 0, 0, "", 0, 0, 0, "idle");
}
