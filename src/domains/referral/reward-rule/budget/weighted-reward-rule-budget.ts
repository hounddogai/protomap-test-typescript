/**
 * The weighted reward rule budget records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reward rule budget is in its life cycle. */
export type WeightedRewardRuleBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted reward rule budget, with what the planners need to act on it. */
export class WeightedRewardRuleBudget {
  code: string;
  title: string;
  country: string;
  attributes: Map<string, string>;
  cohort: string;
  windowDays: number;
  revision: number;
  maximum: number;
  reviewer: string;
  rate: number;
  status: WeightedRewardRuleBudgetStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    attributes: Map<string, string>,
    cohort: string,
    windowDays: number,
    revision: number,
    maximum: number,
    reviewer: string,
    rate: number,
    status: WeightedRewardRuleBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.attributes = attributes;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.revision = revision;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedRewardRuleBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRewardRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round((this.windowDays - this.revision) * 100) / 100;
  }

  copy(): WeightedRewardRuleBudget {
    return new WeightedRewardRuleBudget(
      this.code,
      this.title,
      this.country,
      this.attributes,
      this.cohort,
      this.windowDays,
      this.revision,
      this.maximum,
      this.reviewer,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted reward rule budget in status new. */
export function newWeightedRewardRuleBudget(code: string, title: string): WeightedRewardRuleBudget {
  return new WeightedRewardRuleBudget(code, title, "", new Map<string, string>(), "", 0, 0, 0, "", 0, "new");
}
