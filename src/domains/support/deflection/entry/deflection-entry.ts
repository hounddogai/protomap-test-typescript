/**
 * The deflection entry records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection entry is in its life cycle. */
export type DeflectionEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A deflection entry as the deflection team keeps it. */
export class DeflectionEntry {
  code: string;
  title: string;
  impressions: number;
  frequencyCap: number;
  limit: number;
  priority: number;
  journeyId: string;
  durationMinutes: number;
  variant: string;
  version: number;
  minimum: number;
  status: DeflectionEntryStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    frequencyCap: number,
    limit: number,
    priority: number,
    journeyId: string,
    durationMinutes: number,
    variant: string,
    version: number,
    minimum: number,
    status: DeflectionEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.priority = priority;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.version = version;
    this.minimum = minimum;
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

  canMoveTo(next: DeflectionEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DeflectionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"deflection entry"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.version + this.minimum) * 100) / 100;
  }

  copy(): DeflectionEntry {
    return new DeflectionEntry(
      this.code,
      this.title,
      this.impressions,
      this.frequencyCap,
      this.limit,
      this.priority,
      this.journeyId,
      this.durationMinutes,
      this.variant,
      this.version,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a deflection entry in status planned. */
export function newDeflectionEntry(code: string, title: string): DeflectionEntry {
  return new DeflectionEntry(code, title, 0, 0, 0, 0, "", 0, "", 0, 0, "planned");
}
