/**
 * The seasonal wait exception records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal wait exception is in its life cycle. */
export type SeasonalWaitExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a seasonal wait exception and its current status. */
export class SeasonalWaitException {
  code: string;
  title: string;
  currency: string;
  name: string;
  durationMinutes: number;
  status: SeasonalWaitExceptionStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    name: string,
    durationMinutes: number,
    status: SeasonalWaitExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.name = name;
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

  canMoveTo(next: SeasonalWaitExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalWaitExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal wait exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): SeasonalWaitException {
    return new SeasonalWaitException(
      this.code,
      this.title,
      this.currency,
      this.name,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal wait exception in status proposed. */
export function newSeasonalWaitException(code: string, title: string): SeasonalWaitException {
  return new SeasonalWaitException(code, title, "", "", 0, "proposed");
}
