/**
 * The journey threshold records of journeys's journey work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey threshold is in its life cycle. */
export type JourneyThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a journey threshold and its current status. */
export class JourneyThreshold {
  code: string;
  label: string;
  endsAt: number;
  timezone: string;
  name: string;
  conversionRate: number;
  status: JourneyThresholdStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    timezone: string,
    name: string,
    conversionRate: number,
    status: JourneyThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.name = name;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: JourneyThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: JourneyThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.conversionRate + this.endsAt) * 100) / 100;
  }

  copy(): JourneyThreshold {
    return new JourneyThreshold(
      this.code,
      this.label,
      this.endsAt,
      this.timezone,
      this.name,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey threshold in status planned. */
export function newJourneyThreshold(code: string, label: string): JourneyThreshold {
  return new JourneyThreshold(code, label, 0, "", "", 0, "planned");
}
