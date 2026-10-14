/**
 * The scheduled reward rule summary records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled reward rule summary is in its life cycle. */
export type ScheduledRewardRuleSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled reward rule summary. Its code is unique within a tenant. */
export class ScheduledRewardRuleSummary {
  code: string;
  name: string;
  capacity: number;
  graceDays: number;
  ceiling: number;
  status: ScheduledRewardRuleSummaryStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    graceDays: number,
    ceiling: number,
    status: ScheduledRewardRuleSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.ceiling = ceiling;
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

  canMoveTo(next: ScheduledRewardRuleSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
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

  moveTo(next: ScheduledRewardRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reward rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.graceDays + this.ceiling) * 100) / 100;
  }

  copy(): ScheduledRewardRuleSummary {
    return new ScheduledRewardRuleSummary(
      this.code,
      this.name,
      this.capacity,
      this.graceDays,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled reward rule summary in status idle. */
export function newScheduledRewardRuleSummary(code: string, name: string): ScheduledRewardRuleSummary {
  return new ScheduledRewardRuleSummary(code, name, 0, 0, 0, "idle");
}
