/**
 * The creative forecast records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative forecast is in its life cycle. */
export type CreativeForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A creative forecast as the creative team keeps it. */
export class CreativeForecast {
  code: string;
  name: string;
  approved: boolean;
  openRate: number;
  utmSource: string;
  limit: number;
  revision: number;
  journeyId: string;
  status: CreativeForecastStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    openRate: number,
    utmSource: string,
    limit: number,
    revision: number,
    journeyId: string,
    status: CreativeForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.limit = limit;
    this.revision = revision;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeForecastStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CreativeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedTotal(): number {
    return Math.round((this.revision + this.openRate) * 100) / 100;
  }

  copy(): CreativeForecast {
    return new CreativeForecast(
      this.code,
      this.name,
      this.approved,
      this.openRate,
      this.utmSource,
      this.limit,
      this.revision,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a creative forecast in status new. */
export function newCreativeForecast(code: string, name: string): CreativeForecast {
  return new CreativeForecast(code, name, false, 0, "", 0, 0, "", "new");
}
