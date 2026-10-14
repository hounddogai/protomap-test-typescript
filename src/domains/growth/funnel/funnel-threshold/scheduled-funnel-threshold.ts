/**
 * The scheduled funnel threshold records of growth's funnel work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled funnel threshold is in its life cycle. */
export type ScheduledFunnelThresholdStatus = "created" | "validated" | "published" | "retired";

/** One scheduled funnel threshold, with what the planners need to act on it. */
export class ScheduledFunnelThreshold {
  code: string;
  title: string;
  active: boolean;
  variant: string;
  pinned: boolean;
  cohort: string;
  score: number;
  status: ScheduledFunnelThresholdStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    variant: string,
    pinned: boolean,
    cohort: string,
    score: number,
    status: ScheduledFunnelThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.variant = variant;
    this.pinned = pinned;
    this.cohort = cohort;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledFunnelThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFunnelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled funnel threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ScheduledFunnelThreshold {
    return new ScheduledFunnelThreshold(
      this.code,
      this.title,
      this.active,
      this.variant,
      this.pinned,
      this.cohort,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled funnel threshold in status created. */
export function newScheduledFunnelThreshold(code: string, title: string): ScheduledFunnelThreshold {
  return new ScheduledFunnelThreshold(code, title, false, "", false, "", 0, "created");
}
