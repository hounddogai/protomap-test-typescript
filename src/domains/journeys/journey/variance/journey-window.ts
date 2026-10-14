import * as text from "../../../../kit/text.js";

/** Where a journey window is in its life cycle. */
export type JourneyWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a journey window and its current status. */
export class JourneyWindow {
  code: string;
  name: string;
  minimum: number;
  approved: boolean;
  unit: string;
  conversionRate: number;
  pinned: boolean;
  summary: string;
  status: JourneyWindowStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    approved: boolean,
    unit: string,
    conversionRate: number,
    pinned: boolean,
    summary: string,
    status: JourneyWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.approved = approved;
    this.unit = unit;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.summary = summary;
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

  canMoveTo(next: JourneyWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.minimum * this.conversionRate * 100) / 100;
  }

  copy(): JourneyWindow {
    return new JourneyWindow(
      this.code,
      this.name,
      this.minimum,
      this.approved,
      this.unit,
      this.conversionRate,
      this.pinned,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a journey window in status planned. */
export function newJourneyWindow(code: string, name: string): JourneyWindow {
  return new JourneyWindow(code, name, 0, false, "", 0, false, "", "planned");
}
