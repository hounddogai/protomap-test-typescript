/**
 * The weighted reward forecast records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reward forecast is in its life cycle. */
export type WeightedRewardForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted reward forecast as the reward team keeps it. */
export class WeightedRewardForecast {
  code: string;
  label: string;
  cohort: string;
  ratio: number;
  cost: number;
  ownerId: string;
  budget: number;
  country: string;
  audienceId: string;
  status: WeightedRewardForecastStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    ratio: number,
    cost: number,
    ownerId: string,
    budget: number,
    country: string,
    audienceId: string,
    status: WeightedRewardForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.ratio = ratio;
    this.cost = cost;
    this.ownerId = ownerId;
    this.budget = budget;
    this.country = country;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedRewardForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRewardForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.ratio - this.budget) * 100) / 100;
  }

  copy(): WeightedRewardForecast {
    return new WeightedRewardForecast(
      this.code,
      this.label,
      this.cohort,
      this.ratio,
      this.cost,
      this.ownerId,
      this.budget,
      this.country,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted reward forecast in status proposed. */
export function newWeightedRewardForecast(code: string, label: string): WeightedRewardForecast {
  return new WeightedRewardForecast(code, label, "", 0, 0, "", 0, "", "", "proposed");
}
