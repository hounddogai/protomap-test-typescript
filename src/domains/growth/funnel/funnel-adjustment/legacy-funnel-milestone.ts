import * as text from "../../../../kit/text.js";

/** Where a legacy funnel milestone is in its life cycle. */
export type LegacyFunnelMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One legacy funnel milestone, with what the planners need to act on it. */
export class LegacyFunnelMilestone {
  code: string;
  name: string;
  windowDays: number;
  margin: number;
  ratio: number;
  retries: number;
  weight: number;
  ceiling: number;
  contactEmail: string;
  journeyId: string;
  unit: string;
  status: LegacyFunnelMilestoneStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    margin: number,
    ratio: number,
    retries: number,
    weight: number,
    ceiling: number,
    contactEmail: string,
    journeyId: string,
    unit: string,
    status: LegacyFunnelMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.margin = margin;
    this.ratio = ratio;
    this.retries = retries;
    this.weight = weight;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.unit = unit;
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

  canMoveTo(next: LegacyFunnelMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyFunnelMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy funnel milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round(this.ratio * this.retries * 100) / 100;
  }

  copy(): LegacyFunnelMilestone {
    return new LegacyFunnelMilestone(
      this.code,
      this.name,
      this.windowDays,
      this.margin,
      this.ratio,
      this.retries,
      this.weight,
      this.ceiling,
      this.contactEmail,
      this.journeyId,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a legacy funnel milestone in status idle. */
export function newLegacyFunnelMilestone(code: string, name: string): LegacyFunnelMilestone {
  return new LegacyFunnelMilestone(code, name, 0, 0, 0, 0, 0, 0, "", "", "", "idle");
}
