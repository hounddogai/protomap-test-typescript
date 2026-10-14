/**
 * The scheduled funnel slot records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled funnel slot is in its life cycle. */
export type ScheduledFunnelSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One scheduled funnel slot, with what the planners need to act on it. */
export class ScheduledFunnelSlot {
  code: string;
  title: string;
  description: string;
  reviewer: string;
  updatedAt: number;
  active: boolean;
  limit: number;
  frequencyCap: number;
  maximum: number;
  status: ScheduledFunnelSlotStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    reviewer: string,
    updatedAt: number,
    active: boolean,
    limit: number,
    frequencyCap: number,
    maximum: number,
    status: ScheduledFunnelSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.active = active;
    this.limit = limit;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledFunnelSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFunnelSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled funnel slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled funnel slot"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.maximum + this.updatedAt) * 100) / 100;
  }

  copy(): ScheduledFunnelSlot {
    return new ScheduledFunnelSlot(
      this.code,
      this.title,
      this.description,
      this.reviewer,
      this.updatedAt,
      this.active,
      this.limit,
      this.frequencyCap,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled funnel slot in status proposed. */
export function newScheduledFunnelSlot(code: string, title: string): ScheduledFunnelSlot {
  return new ScheduledFunnelSlot(code, title, "", "", 0, false, 0, 0, 0, "proposed");
}
