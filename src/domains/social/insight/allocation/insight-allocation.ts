/**
 * The insight allocation records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight allocation is in its life cycle. */
export type InsightAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One insight allocation, with what the planners need to act on it. */
export class InsightAllocation {
  code: string;
  name: string;
  visible: boolean;
  bid: number;
  utmSource: string;
  status: InsightAllocationStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    bid: number,
    utmSource: string,
    status: InsightAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.bid = bid;
    this.utmSource = utmSource;
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

  canMoveTo(next: InsightAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: InsightAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): InsightAllocation {
    return new InsightAllocation(this.code, this.name, this.visible, this.bid, this.utmSource, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a insight allocation in status idle. */
export function newInsightAllocation(code: string, name: string): InsightAllocation {
  return new InsightAllocation(code, name, false, 0, "", "idle");
}
