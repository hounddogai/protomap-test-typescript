import * as text from "../../../../kit/text.js";

/** Where a deflection milestone is in its life cycle. */
export type DeflectionMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One deflection milestone, with what the planners need to act on it. */
export class DeflectionMilestone {
  code: string;
  label: string;
  campaignRef: string;
  budget: number;
  amount: number;
  journeyId: string;
  windowDays: number;
  approved: boolean;
  status: DeflectionMilestoneStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    budget: number,
    amount: number,
    journeyId: string,
    windowDays: number,
    approved: boolean,
    status: DeflectionMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.amount = amount;
    this.journeyId = journeyId;
    this.windowDays = windowDays;
    this.approved = approved;
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

  canMoveTo(next: DeflectionMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
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

  moveTo(next: DeflectionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"deflection milestone"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.budget - this.windowDays) * 100) / 100;
  }

  copy(): DeflectionMilestone {
    return new DeflectionMilestone(
      this.code,
      this.label,
      this.campaignRef,
      this.budget,
      this.amount,
      this.journeyId,
      this.windowDays,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a deflection milestone in status idle. */
export function newDeflectionMilestone(code: string, label: string): DeflectionMilestone {
  return new DeflectionMilestone(code, label, "", 0, 0, "", 0, false, "idle");
}
