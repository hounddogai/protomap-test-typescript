import * as text from "../../../../kit/text.js";

/** Where a scheduled flight slot is in its life cycle. */
export type ScheduledFlightSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled flight slot. Its code is unique within a tenant. */
export class ScheduledFlightSlot {
  code: string;
  name: string;
  locale: string;
  updatedAt: number;
  summary: string;
  timezone: string;
  status: ScheduledFlightSlotStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    updatedAt: number,
    summary: string,
    timezone: string,
    status: ScheduledFlightSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.summary = summary;
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

  canMoveTo(next: ScheduledFlightSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFlightSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled flight slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): ScheduledFlightSlot {
    return new ScheduledFlightSlot(
      this.code,
      this.name,
      this.locale,
      this.updatedAt,
      this.summary,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled flight slot in status proposed. */
export function newScheduledFlightSlot(code: string, name: string): ScheduledFlightSlot {
  return new ScheduledFlightSlot(code, name, "", 0, "", "", "proposed");
}
