/**
 * The global nudge forecast records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global nudge forecast is in its life cycle. */
export type GlobalNudgeForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One global nudge forecast, with what the planners need to act on it. */
export class GlobalNudgeForecast {
  code: string;
  title: string;
  score: number;
  sequence: number;
  limit: number;
  archived: boolean;
  status: GlobalNudgeForecastStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    sequence: number,
    limit: number,
    archived: boolean,
    status: GlobalNudgeForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.sequence = sequence;
    this.limit = limit;
    this.archived = archived;
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

  canMoveTo(next: GlobalNudgeForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalNudgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global nudge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global nudge forecast"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.score - this.limit) * 100) / 100;
  }

  copy(): GlobalNudgeForecast {
    return new GlobalNudgeForecast(
      this.code,
      this.title,
      this.score,
      this.sequence,
      this.limit,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global nudge forecast in status proposed. */
export function newGlobalNudgeForecast(code: string, title: string): GlobalNudgeForecast {
  return new GlobalNudgeForecast(code, title, 0, 0, 0, false, "proposed");
}
