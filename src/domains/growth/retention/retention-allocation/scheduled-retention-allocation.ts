/**
 * The scheduled retention allocation records of growth's retention work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled retention allocation is in its life cycle. */
export type ScheduledRetentionAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a scheduled retention allocation and its current status. */
export class ScheduledRetentionAllocation {
  code: string;
  name: string;
  ceiling: number;
  label: string;
  maximum: number;
  status: ScheduledRetentionAllocationStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    label: string,
    maximum: number,
    status: ScheduledRetentionAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.label = label;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledRetentionAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledRetentionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled retention allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled retention allocation"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.maximum * this.ceiling * 100) / 100;
  }

  copy(): ScheduledRetentionAllocation {
    return new ScheduledRetentionAllocation(this.code, this.name, this.ceiling, this.label, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled retention allocation in status open. */
export function newScheduledRetentionAllocation(code: string, name: string): ScheduledRetentionAllocation {
  return new ScheduledRetentionAllocation(code, name, 0, "", 0, "open");
}
