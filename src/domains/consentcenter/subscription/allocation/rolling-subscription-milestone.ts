import * as text from "../../../../kit/text.js";

/** Where a rolling subscription milestone is in its life cycle. */
export type RollingSubscriptionMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a rolling subscription milestone and its current status. */
export class RollingSubscriptionMilestone {
  code: string;
  title: string;
  channel: string;
  journeyId: string;
  frequencyCap: number;
  cost: number;
  floorValue: number;
  conversionRate: number;
  campaignRef: string;
  budget: number;
  segment: string;
  status: RollingSubscriptionMilestoneStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    journeyId: string,
    frequencyCap: number,
    cost: number,
    floorValue: number,
    conversionRate: number,
    campaignRef: string,
    budget: number,
    segment: string,
    status: RollingSubscriptionMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.segment = segment;
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

  canMoveTo(next: RollingSubscriptionMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingSubscriptionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling subscription milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.floorValue + this.frequencyCap) * 100) / 100;
  }

  copy(): RollingSubscriptionMilestone {
    return new RollingSubscriptionMilestone(
      this.code,
      this.title,
      this.channel,
      this.journeyId,
      this.frequencyCap,
      this.cost,
      this.floorValue,
      this.conversionRate,
      this.campaignRef,
      this.budget,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling subscription milestone in status new. */
export function newRollingSubscriptionMilestone(code: string, title: string): RollingSubscriptionMilestone {
  return new RollingSubscriptionMilestone(code, title, "", "", 0, 0, 0, 0, "", 0, "", "new");
}
