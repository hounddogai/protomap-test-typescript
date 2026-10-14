/**
 * The weighted window entry records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted window entry is in its life cycle. */
export type WeightedWindowEntryStatus = "created" | "validated" | "published" | "retired";

/** A weighted window entry as the window team keeps it. */
export class WeightedWindowEntry {
  code: string;
  title: string;
  source: string;
  minimum: number;
  archived: boolean;
  campaignRef: string;
  durationMinutes: number;
  status: WeightedWindowEntryStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    minimum: number,
    archived: boolean,
    campaignRef: string,
    durationMinutes: number,
    status: WeightedWindowEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.minimum = minimum;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedWindowEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedWindowEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted window entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.durationMinutes + this.minimum) * 100) / 100;
  }

  copy(): WeightedWindowEntry {
    return new WeightedWindowEntry(
      this.code,
      this.title,
      this.source,
      this.minimum,
      this.archived,
      this.campaignRef,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted window entry in status created. */
export function newWeightedWindowEntry(code: string, title: string): WeightedWindowEntry {
  return new WeightedWindowEntry(code, title, "", 0, false, "", 0, "created");
}
