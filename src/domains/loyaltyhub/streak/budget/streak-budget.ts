/**
 * The streak budget records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak budget is in its life cycle. */
export type StreakBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One streak budget, with what the planners need to act on it. */
export class StreakBudget {
  code: string;
  name: string;
  segment: string;
  expiresAt: number;
  floorValue: number;
  archived: boolean;
  cohort: string;
  budget: number;
  channel: string;
  openRate: number;
  status: StreakBudgetStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    expiresAt: number,
    floorValue: number,
    archived: boolean,
    cohort: string,
    budget: number,
    channel: string,
    openRate: number,
    status: StreakBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.expiresAt = expiresAt;
    this.floorValue = floorValue;
    this.archived = archived;
    this.cohort = cohort;
    this.budget = budget;
    this.channel = channel;
    this.openRate = openRate;
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

  canMoveTo(next: StreakBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.openRate + this.expiresAt) * 100) / 100;
  }

  copy(): StreakBudget {
    return new StreakBudget(
      this.code,
      this.name,
      this.segment,
      this.expiresAt,
      this.floorValue,
      this.archived,
      this.cohort,
      this.budget,
      this.channel,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a streak budget in status idle. */
export function newStreakBudget(code: string, name: string): StreakBudget {
  return new StreakBudget(code, name, "", 0, 0, false, "", 0, "", 0, "idle");
}
