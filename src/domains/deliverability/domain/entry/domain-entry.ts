/**
 * The domain entry records of deliverability's domain work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a domain entry is in its life cycle. */
export type DomainEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a domain entry and its current status. */
export class DomainEntry {
  code: string;
  name: string;
  threshold: number;
  endsAt: number;
  region: string;
  windowDays: number;
  timezone: string;
  pinned: boolean;
  unit: string;
  status: DomainEntryStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    endsAt: number,
    region: string,
    windowDays: number,
    timezone: string,
    pinned: boolean,
    unit: string,
    status: DomainEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.endsAt = endsAt;
    this.region = region;
    this.windowDays = windowDays;
    this.timezone = timezone;
    this.pinned = pinned;
    this.unit = unit;
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

  canMoveTo(next: DomainEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"domain entry"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.windowDays - this.endsAt) * 100) / 100;
  }

  copy(): DomainEntry {
    return new DomainEntry(
      this.code,
      this.name,
      this.threshold,
      this.endsAt,
      this.region,
      this.windowDays,
      this.timezone,
      this.pinned,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a domain entry in status planned. */
export function newDomainEntry(code: string, name: string): DomainEntry {
  return new DomainEntry(code, name, 0, 0, "", 0, "", false, "", "planned");
}
