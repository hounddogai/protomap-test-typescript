/**
 * The preference forecast records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference forecast is in its life cycle. */
export type PreferenceForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One preference forecast, with what the planners need to act on it. */
export class PreferenceForecast {
  code: string;
  name: string;
  archived: boolean;
  revision: number;
  maximum: number;
  createdAt: number;
  durationMinutes: number;
  status: PreferenceForecastStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    revision: number,
    maximum: number,
    createdAt: number,
    durationMinutes: number,
    status: PreferenceForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.revision = revision;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: PreferenceForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PreferenceForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.maximum * this.createdAt * 100) / 100;
  }

  copy(): PreferenceForecast {
    return new PreferenceForecast(
      this.code,
      this.name,
      this.archived,
      this.revision,
      this.maximum,
      this.createdAt,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a preference forecast in status proposed. */
export function newPreferenceForecast(code: string, name: string): PreferenceForecast {
  return new PreferenceForecast(code, name, false, 0, 0, 0, 0, "proposed");
}
