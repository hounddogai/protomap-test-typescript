/**
 * The credit forecast records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit forecast is in its life cycle. */
export type CreditForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a credit forecast and its current status. */
export class CreditForecast {
  code: string;
  title: string;
  durationMinutes: number;
  revision: number;
  bid: number;
  notes: string;
  startsAt: number;
  weight: number;
  amount: number;
  limit: number;
  status: CreditForecastStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    revision: number,
    bid: number,
    notes: string,
    startsAt: number,
    weight: number,
    amount: number,
    limit: number,
    status: CreditForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.revision = revision;
    this.bid = bid;
    this.notes = notes;
    this.startsAt = startsAt;
    this.weight = weight;
    this.amount = amount;
    this.limit = limit;
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

  canMoveTo(next: CreditForecastStatus): boolean {
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"credit forecast"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.limit + this.startsAt) * 100) / 100;
  }

  copy(): CreditForecast {
    return new CreditForecast(
      this.code,
      this.title,
      this.durationMinutes,
      this.revision,
      this.bid,
      this.notes,
      this.startsAt,
      this.weight,
      this.amount,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a credit forecast in status proposed. */
export function newCreditForecast(code: string, title: string): CreditForecast {
  return new CreditForecast(code, title, 0, 0, 0, "", 0, 0, 0, 0, "proposed");
}
