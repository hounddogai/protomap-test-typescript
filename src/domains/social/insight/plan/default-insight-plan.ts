/**
 * The default insight plan records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default insight plan is in its life cycle. */
export type DefaultInsightPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default insight plan as the insight team keeps it. */
export class DefaultInsightPlan {
  code: string;
  name: string;
  revision: number;
  clicks: number;
  limit: number;
  status: DefaultInsightPlanStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    clicks: number,
    limit: number,
    status: DefaultInsightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.clicks = clicks;
    this.limit = limit;
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

  canMoveTo(next: DefaultInsightPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: DefaultInsightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default insight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round(this.revision * this.clicks * 100) / 100;
  }

  copy(): DefaultInsightPlan {
    return new DefaultInsightPlan(this.code, this.name, this.revision, this.clicks, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default insight plan in status idle. */
export function newDefaultInsightPlan(code: string, name: string): DefaultInsightPlan {
  return new DefaultInsightPlan(code, name, 0, 0, 0, "idle");
}
