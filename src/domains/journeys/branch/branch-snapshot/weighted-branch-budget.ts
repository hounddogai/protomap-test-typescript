import * as text from "../../../../kit/text.js";

/** Where a weighted branch budget is in its life cycle. */
export type WeightedBranchBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted branch budget as the branch team keeps it. */
export class WeightedBranchBudget {
  code: string;
  title: string;
  discount: number;
  phone: string;
  threshold: number;
  score: number;
  status: WeightedBranchBudgetStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    phone: string,
    threshold: number,
    score: number,
    status: WeightedBranchBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.phone = phone;
    this.threshold = threshold;
    this.score = score;
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

  canMoveTo(next: WeightedBranchBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedBranchBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted branch budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round((this.threshold - this.score) * 100) / 100;
  }

  copy(): WeightedBranchBudget {
    return new WeightedBranchBudget(
      this.code,
      this.title,
      this.discount,
      this.phone,
      this.threshold,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted branch budget in status idle. */
export function newWeightedBranchBudget(code: string, title: string): WeightedBranchBudget {
  return new WeightedBranchBudget(code, title, 0, "", 0, 0, "idle");
}
