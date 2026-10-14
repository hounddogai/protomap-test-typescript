import * as text from "../../../../kit/text.js";

/** Where a invite slot is in its life cycle. */
export type InviteSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a invite slot and its current status. */
export class InviteSlot {
  code: string;
  label: string;
  priority: number;
  endsAt: number;
  windowDays: number;
  unit: string;
  contactEmail: string;
  campaignRef: string;
  ceiling: number;
  timezone: string;
  status: InviteSlotStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    endsAt: number,
    windowDays: number,
    unit: string,
    contactEmail: string,
    campaignRef: string,
    ceiling: number,
    timezone: string,
    status: InviteSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.endsAt = endsAt;
    this.windowDays = windowDays;
    this.unit = unit;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.ceiling = ceiling;
    this.timezone = timezone;
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

  canMoveTo(next: InviteSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
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

  moveTo(next: InviteSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"invite slot"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.priority * this.windowDays * 100) / 100;
  }

  copy(): InviteSlot {
    return new InviteSlot(
      this.code,
      this.label,
      this.priority,
      this.endsAt,
      this.windowDays,
      this.unit,
      this.contactEmail,
      this.campaignRef,
      this.ceiling,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a invite slot in status idle. */
export function newInviteSlot(code: string, label: string): InviteSlot {
  return new InviteSlot(code, label, 0, 0, 0, "", "", "", 0, "", "idle");
}
