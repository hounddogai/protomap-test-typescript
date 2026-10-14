import * as text from "../../../../kit/text.js";

/** Where a scheduled opt out slot is in its life cycle. */
export type ScheduledOptOutSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled opt out slot. Its code is unique within a tenant. */
export class ScheduledOptOutSlot {
  code: string;
  name: string;
  expiresAt: number;
  notes: string;
  unit: string;
  maximum: number;
  locale: string;
  timezone: string;
  status: ScheduledOptOutSlotStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    notes: string,
    unit: string,
    maximum: number,
    locale: string,
    timezone: string,
    status: ScheduledOptOutSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.notes = notes;
    this.unit = unit;
    this.maximum = maximum;
    this.locale = locale;
    this.timezone = timezone;
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

  canMoveTo(next: ScheduledOptOutSlotStatus): boolean {
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

  moveTo(next: ScheduledOptOutSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled opt out slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled opt out slot"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.expiresAt + this.maximum) * 100) / 100;
  }

  copy(): ScheduledOptOutSlot {
    return new ScheduledOptOutSlot(
      this.code,
      this.name,
      this.expiresAt,
      this.notes,
      this.unit,
      this.maximum,
      this.locale,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled opt out slot in status proposed. */
export function newScheduledOptOutSlot(code: string, name: string): ScheduledOptOutSlot {
  return new ScheduledOptOutSlot(code, name, 0, "", "", 0, "", "", "proposed");
}
