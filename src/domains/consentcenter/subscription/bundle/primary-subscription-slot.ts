import * as text from "../../../../kit/text.js";

/** Where a primary subscription slot is in its life cycle. */
export type PrimarySubscriptionSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a primary subscription slot and its current status. */
export class PrimarySubscriptionSlot {
  code: string;
  title: string;
  timezone: string;
  durationMinutes: number;
  label: string;
  status: PrimarySubscriptionSlotStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    durationMinutes: number,
    label: string,
    status: PrimarySubscriptionSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
    this.label = label;
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

  canMoveTo(next: PrimarySubscriptionSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
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

  moveTo(next: PrimarySubscriptionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary subscription slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary subscription slot"} ${this.code}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): PrimarySubscriptionSlot {
    return new PrimarySubscriptionSlot(
      this.code,
      this.title,
      this.timezone,
      this.durationMinutes,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary subscription slot in status idle. */
export function newPrimarySubscriptionSlot(code: string, title: string): PrimarySubscriptionSlot {
  return new PrimarySubscriptionSlot(code, title, "", 0, "", "idle");
}
