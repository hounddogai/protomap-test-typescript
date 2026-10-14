/**
 * The weighted subscription milestone records of consentcenter's subscription work, and the rules, stores,
 * and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted subscription milestone is in its life cycle. */
export type WeightedSubscriptionMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One weighted subscription milestone, with what the planners need to act on it. */
export class WeightedSubscriptionMilestone {
  code: string;
  title: string;
  openRate: number;
  budget: number;
  ratio: number;
  status: WeightedSubscriptionMilestoneStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    budget: number,
    ratio: number,
    status: WeightedSubscriptionMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.budget = budget;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedSubscriptionMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedSubscriptionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted subscription milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.openRate - this.budget) * 100) / 100;
  }

  copy(): WeightedSubscriptionMilestone {
    return new WeightedSubscriptionMilestone(
      this.code,
      this.title,
      this.openRate,
      this.budget,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted subscription milestone in status open. */
export function newWeightedSubscriptionMilestone(code: string, title: string): WeightedSubscriptionMilestone {
  return new WeightedSubscriptionMilestone(code, title, 0, 0, 0, "open");
}
