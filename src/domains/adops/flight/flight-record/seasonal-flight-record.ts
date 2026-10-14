/**
 * The seasonal flight record records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal flight record is in its life cycle. */
export type SeasonalFlightRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal flight record, with what the planners need to act on it. */
export class SeasonalFlightRecord {
  code: string;
  name: string;
  frequencyCap: number;
  capacity: number;
  label: string;
  locale: string;
  notes: string;
  archived: boolean;
  status: SeasonalFlightRecordStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    capacity: number,
    label: string,
    locale: string,
    notes: string,
    archived: boolean,
    status: SeasonalFlightRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.capacity = capacity;
    this.label = label;
    this.locale = locale;
    this.notes = notes;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalFlightRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalFlightRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal flight record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal flight record"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.capacity + this.frequencyCap) * 100) / 100;
  }

  copy(): SeasonalFlightRecord {
    return new SeasonalFlightRecord(
      this.code,
      this.name,
      this.frequencyCap,
      this.capacity,
      this.label,
      this.locale,
      this.notes,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal flight record in status draft. */
export function newSeasonalFlightRecord(code: string, name: string): SeasonalFlightRecord {
  return new SeasonalFlightRecord(code, name, 0, 0, "", "", "", false, "draft");
}
