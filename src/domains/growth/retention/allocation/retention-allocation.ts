/**
 * The retention allocation records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention allocation is in its life cycle. */
export type RetentionAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A retention allocation as the retention team keeps it. */
export class RetentionAllocation {
  code: string;
  label: string;
  channel: string;
  openRate: number;
  discount: number;
  status: RetentionAllocationStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    openRate: number,
    discount: number,
    status: RetentionAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.openRate = openRate;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RetentionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"retention allocation"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.discount - this.openRate) * 100) / 100;
  }

  copy(): RetentionAllocation {
    return new RetentionAllocation(this.code, this.label, this.channel, this.openRate, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a retention allocation in status planned. */
export function newRetentionAllocation(code: string, label: string): RetentionAllocation {
  return new RetentionAllocation(code, label, "", 0, 0, "planned");
}
