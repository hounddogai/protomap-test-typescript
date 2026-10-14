/**
 * The regional pacing forecast records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional pacing forecast is in its life cycle. */
export type RegionalPacingForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** One regional pacing forecast, with what the planners need to act on it. */
export class RegionalPacingForecast {
  code: string;
  title: string;
  description: string;
  active: boolean;
  checksum: string;
  source: string;
  score: number;
  status: RegionalPacingForecastStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    active: boolean,
    checksum: string,
    source: string,
    score: number,
    status: RegionalPacingForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.active = active;
    this.checksum = checksum;
    this.source = source;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPacingForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalPacingForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional pacing forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional pacing forecast"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): RegionalPacingForecast {
    return new RegionalPacingForecast(
      this.code,
      this.title,
      this.description,
      this.active,
      this.checksum,
      this.source,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional pacing forecast in status requested. */
export function newRegionalPacingForecast(code: string, title: string): RegionalPacingForecast {
  return new RegionalPacingForecast(code, title, "", false, "", "", 0, "requested");
}
