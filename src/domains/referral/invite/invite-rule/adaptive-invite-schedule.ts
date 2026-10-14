import * as text from "../../../../kit/text.js";

/** Where a adaptive invite schedule is in its life cycle. */
export type AdaptiveInviteScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive invite schedule as the invite team keeps it. */
export class AdaptiveInviteSchedule {
  code: string;
  label: string;
  title: string;
  timezone: string;
  unit: string;
  utmSource: string;
  sendAt: number;
  minimum: number;
  quantity: number;
  status: AdaptiveInviteScheduleStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    timezone: string,
    unit: string,
    utmSource: string,
    sendAt: number,
    minimum: number,
    quantity: number,
    status: AdaptiveInviteScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.timezone = timezone;
    this.unit = unit;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
    this.minimum = minimum;
    this.quantity = quantity;
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

  canMoveTo(next: AdaptiveInviteScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveInviteScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive invite schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.quantity - this.sendAt) * 100) / 100;
  }

  copy(): AdaptiveInviteSchedule {
    return new AdaptiveInviteSchedule(
      this.code,
      this.label,
      this.title,
      this.timezone,
      this.unit,
      this.utmSource,
      this.sendAt,
      this.minimum,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive invite schedule in status idle. */
export function newAdaptiveInviteSchedule(code: string, label: string): AdaptiveInviteSchedule {
  return new AdaptiveInviteSchedule(code, label, "", "", "", "", 0, 0, 0, "idle");
}
