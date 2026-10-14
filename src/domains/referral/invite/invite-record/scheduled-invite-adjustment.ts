import * as text from "../../../../kit/text.js";

/** Where a scheduled invite adjustment is in its life cycle. */
export type ScheduledInviteAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a scheduled invite adjustment and its current status. */
export class ScheduledInviteAdjustment {
  code: string;
  name: string;
  priority: number;
  locale: string;
  floorValue: number;
  active: boolean;
  startsAt: number;
  status: ScheduledInviteAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    locale: string,
    floorValue: number,
    active: boolean,
    startsAt: number,
    status: ScheduledInviteAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.locale = locale;
    this.floorValue = floorValue;
    this.active = active;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledInviteAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledInviteAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled invite adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled invite adjustment"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.startsAt - this.priority) * 100) / 100;
  }

  copy(): ScheduledInviteAdjustment {
    return new ScheduledInviteAdjustment(
      this.code,
      this.name,
      this.priority,
      this.locale,
      this.floorValue,
      this.active,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled invite adjustment in status requested. */
export function newScheduledInviteAdjustment(code: string, name: string): ScheduledInviteAdjustment {
  return new ScheduledInviteAdjustment(code, name, 0, "", 0, false, 0, "requested");
}
