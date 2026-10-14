/**
 * The seasonal reward budget records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal reward budget is in its life cycle. */
export type SeasonalRewardBudgetStatus = "created" | "validated" | "published" | "retired";

/** The record of a seasonal reward budget and its current status. */
export class SeasonalRewardBudget {
  code: string;
  label: string;
  country: string;
  minimum: number;
  windowDays: number;
  active: boolean;
  pinned: boolean;
  category: string;
  archived: boolean;
  status: SeasonalRewardBudgetStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    minimum: number,
    windowDays: number,
    active: boolean,
    pinned: boolean,
    category: string,
    archived: boolean,
    status: SeasonalRewardBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.active = active;
    this.pinned = pinned;
    this.category = category;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalRewardBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalRewardBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal reward budget"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.windowDays * this.minimum * 100) / 100;
  }

  copy(): SeasonalRewardBudget {
    return new SeasonalRewardBudget(
      this.code,
      this.label,
      this.country,
      this.minimum,
      this.windowDays,
      this.active,
      this.pinned,
      this.category,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal reward budget in status created. */
export function newSeasonalRewardBudget(code: string, label: string): SeasonalRewardBudget {
  return new SeasonalRewardBudget(code, label, "", 0, 0, false, false, "", false, "created");
}
