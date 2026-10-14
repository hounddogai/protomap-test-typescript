/**
 * The paywall estimate records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall estimate is in its life cycle. */
export type PaywallEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One paywall estimate, with what the planners need to act on it. */
export class PaywallEstimate {
  code: string;
  name: string;
  floorValue: number;
  ratio: number;
  startsAt: number;
  openRate: number;
  cohort: string;
  budget: number;
  status: PaywallEstimateStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    ratio: number,
    startsAt: number,
    openRate: number,
    cohort: string,
    budget: number,
    status: PaywallEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.ratio = ratio;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.cohort = cohort;
    this.budget = budget;
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

  canMoveTo(next: PaywallEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PaywallEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt + this.openRate) * 100) / 100;
  }

  copy(): PaywallEstimate {
    return new PaywallEstimate(
      this.code,
      this.name,
      this.floorValue,
      this.ratio,
      this.startsAt,
      this.openRate,
      this.cohort,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a paywall estimate in status idle. */
export function newPaywallEstimate(code: string, name: string): PaywallEstimate {
  return new PaywallEstimate(code, name, 0, 0, 0, 0, "", 0, "idle");
}
