/**
 * The seasonal paywall schedule records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal paywall schedule is in its life cycle. */
export type SeasonalPaywallScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a seasonal paywall schedule and its current status. */
export class SeasonalPaywallSchedule {
  code: string;
  label: string;
  threshold: number;
  variant: string;
  batchSize: number;
  status: SeasonalPaywallScheduleStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    variant: string,
    batchSize: number,
    status: SeasonalPaywallScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.variant = variant;
    this.batchSize = batchSize;
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

  canMoveTo(next: SeasonalPaywallScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalPaywallScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal paywall schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.threshold + this.batchSize) * 100) / 100;
  }

  copy(): SeasonalPaywallSchedule {
    return new SeasonalPaywallSchedule(
      this.code,
      this.label,
      this.threshold,
      this.variant,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal paywall schedule in status new. */
export function newSeasonalPaywallSchedule(code: string, label: string): SeasonalPaywallSchedule {
  return new SeasonalPaywallSchedule(code, label, 0, "", 0, "new");
}
