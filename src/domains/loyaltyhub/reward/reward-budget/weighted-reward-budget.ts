/**
 * The weighted reward budget records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reward budget is in its life cycle. */
export type WeightedRewardBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted reward budget. Its code is unique within a tenant. */
export class WeightedRewardBudget {
  code: string;
  name: string;
  campaignRef: string;
  durationMinutes: number;
  priority: number;
  notes: string;
  archived: boolean;
  cohort: string;
  status: WeightedRewardBudgetStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    durationMinutes: number,
    priority: number,
    notes: string,
    archived: boolean,
    cohort: string,
    status: WeightedRewardBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
    this.notes = notes;
    this.archived = archived;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedRewardBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRewardBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.priority * this.durationMinutes * 100) / 100;
  }

  copy(): WeightedRewardBudget {
    return new WeightedRewardBudget(
      this.code,
      this.name,
      this.campaignRef,
      this.durationMinutes,
      this.priority,
      this.notes,
      this.archived,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted reward budget in status planned. */
export function newWeightedRewardBudget(code: string, name: string): WeightedRewardBudget {
  return new WeightedRewardBudget(code, name, "", 0, 0, "", false, "", "planned");
}
