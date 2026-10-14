/**
 * The complaint cycle records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint cycle is in its life cycle. */
export type ComplaintCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A complaint cycle as the complaint team keeps it. */
export class ComplaintCycle {
  code: string;
  label: string;
  timezone: string;
  active: boolean;
  cost: number;
  channel: string;
  audienceId: string;
  category: string;
  floorValue: number;
  rate: number;
  visible: boolean;
  status: ComplaintCycleStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    active: boolean,
    cost: number,
    channel: string,
    audienceId: string,
    category: string,
    floorValue: number,
    rate: number,
    visible: boolean,
    status: ComplaintCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.active = active;
    this.cost = cost;
    this.channel = channel;
    this.audienceId = audienceId;
    this.category = category;
    this.floorValue = floorValue;
    this.rate = rate;
    this.visible = visible;
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

  canMoveTo(next: ComplaintCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
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

  moveTo(next: ComplaintCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"complaint cycle"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.cost + this.rate) * 100) / 100;
  }

  copy(): ComplaintCycle {
    return new ComplaintCycle(
      this.code,
      this.label,
      this.timezone,
      this.active,
      this.cost,
      this.channel,
      this.audienceId,
      this.category,
      this.floorValue,
      this.rate,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a complaint cycle in status proposed. */
export function newComplaintCycle(code: string, label: string): ComplaintCycle {
  return new ComplaintCycle(code, label, "", false, 0, "", "", "", 0, 0, false, "proposed");
}
