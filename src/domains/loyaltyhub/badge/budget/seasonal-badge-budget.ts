/**
 * The seasonal badge budget records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal badge budget is in its life cycle. */
export type SeasonalBadgeBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal badge budget. Its code is unique within a tenant. */
export class SeasonalBadgeBudget {
  code: string;
  label: string;
  active: boolean;
  frequencyCap: number;
  channel: string;
  budget: number;
  threshold: number;
  weight: number;
  createdAt: number;
  cost: number;
  status: SeasonalBadgeBudgetStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    frequencyCap: number,
    channel: string,
    budget: number,
    threshold: number,
    weight: number,
    createdAt: number,
    cost: number,
    status: SeasonalBadgeBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.budget = budget;
    this.threshold = threshold;
    this.weight = weight;
    this.createdAt = createdAt;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalBadgeBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalBadgeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal badge budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round((this.createdAt - this.frequencyCap) * 100) / 100;
  }

  copy(): SeasonalBadgeBudget {
    return new SeasonalBadgeBudget(
      this.code,
      this.label,
      this.active,
      this.frequencyCap,
      this.channel,
      this.budget,
      this.threshold,
      this.weight,
      this.createdAt,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal badge budget in status proposed. */
export function newSeasonalBadgeBudget(code: string, label: string): SeasonalBadgeBudget {
  return new SeasonalBadgeBudget(code, label, false, 0, "", 0, 0, 0, 0, 0, "proposed");
}
