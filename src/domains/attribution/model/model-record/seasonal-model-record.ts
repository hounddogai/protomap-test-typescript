/**
 * The seasonal model record records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal model record is in its life cycle. */
export type SeasonalModelRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal model record as the model team keeps it. */
export class SeasonalModelRecord {
  code: string;
  name: string;
  priority: number;
  impressions: number;
  retries: number;
  country: string;
  locale: string;
  conversionRate: number;
  startsAt: number;
  status: SeasonalModelRecordStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    impressions: number,
    retries: number,
    country: string,
    locale: string,
    conversionRate: number,
    startsAt: number,
    status: SeasonalModelRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.impressions = impressions;
    this.retries = retries;
    this.country = country;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
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

  canMoveTo(next: SeasonalModelRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalModelRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal model record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt + this.impressions) * 100) / 100;
  }

  copy(): SeasonalModelRecord {
    return new SeasonalModelRecord(
      this.code,
      this.name,
      this.priority,
      this.impressions,
      this.retries,
      this.country,
      this.locale,
      this.conversionRate,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal model record in status proposed. */
export function newSeasonalModelRecord(code: string, name: string): SeasonalModelRecord {
  return new SeasonalModelRecord(code, name, 0, 0, 0, "", "", 0, 0, "proposed");
}
