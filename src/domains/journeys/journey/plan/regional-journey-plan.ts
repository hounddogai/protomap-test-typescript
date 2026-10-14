/**
 * The regional journey plan records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional journey plan is in its life cycle. */
export type RegionalJourneyPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional journey plan as the journey team keeps it. */
export class RegionalJourneyPlan {
  code: string;
  label: string;
  clicks: number;
  rate: number;
  revision: number;
  ownerId: string;
  channel: string;
  country: string;
  priority: number;
  bid: number;
  tags: string[];
  status: RegionalJourneyPlanStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    rate: number,
    revision: number,
    ownerId: string,
    channel: string,
    country: string,
    priority: number,
    bid: number,
    tags: string[],
    status: RegionalJourneyPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.rate = rate;
    this.revision = revision;
    this.ownerId = ownerId;
    this.channel = channel;
    this.country = country;
    this.priority = priority;
    this.bid = bid;
    this.tags = tags;
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

  canMoveTo(next: RegionalJourneyPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalJourneyPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional journey plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"regional journey plan"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round(this.clicks * this.priority * 100) / 100;
  }

  copy(): RegionalJourneyPlan {
    return new RegionalJourneyPlan(
      this.code,
      this.label,
      this.clicks,
      this.rate,
      this.revision,
      this.ownerId,
      this.channel,
      this.country,
      this.priority,
      this.bid,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional journey plan in status idle. */
export function newRegionalJourneyPlan(code: string, label: string): RegionalJourneyPlan {
  return new RegionalJourneyPlan(code, label, 0, 0, 0, "", "", "", 0, 0, [], "idle");
}
