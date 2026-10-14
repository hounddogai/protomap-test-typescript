/**
 * The challenge forecast records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge forecast is in its life cycle. */
export type ChallengeForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A challenge forecast. Its code is unique within a tenant. */
export class ChallengeForecast {
  code: string;
  name: string;
  version: number;
  archived: boolean;
  budget: number;
  visible: boolean;
  timezone: string;
  status: ChallengeForecastStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    archived: boolean,
    budget: number,
    visible: boolean,
    timezone: string,
    status: ChallengeForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.archived = archived;
    this.budget = budget;
    this.visible = visible;
    this.timezone = timezone;
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

  canMoveTo(next: ChallengeForecastStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
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
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round(this.version * this.budget * 100) / 100;
  }

  copy(): ChallengeForecast {
    return new ChallengeForecast(
      this.code,
      this.name,
      this.version,
      this.archived,
      this.budget,
      this.visible,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a challenge forecast in status new. */
export function newChallengeForecast(code: string, name: string): ChallengeForecast {
  return new ChallengeForecast(code, name, 0, false, 0, false, "", "new");
}
