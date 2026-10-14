/**
 * The paywall milestone records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall milestone is in its life cycle. */
export type PaywallMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a paywall milestone and its current status. */
export class PaywallMilestone {
  code: string;
  title: string;
  summary: string;
  budget: number;
  campaignRef: string;
  status: PaywallMilestoneStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    budget: number,
    campaignRef: string,
    status: PaywallMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.budget = budget;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PaywallMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"paywall milestone"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PaywallMilestone {
    return new PaywallMilestone(this.code, this.title, this.summary, this.budget, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a paywall milestone in status planned. */
export function newPaywallMilestone(code: string, title: string): PaywallMilestone {
  return new PaywallMilestone(code, title, "", 0, "", "planned");
}
