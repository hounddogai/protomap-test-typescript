import * as text from "../../../../kit/text.js";

/** Where a wait forecast is in its life cycle. */
export type WaitForecastStatus = "created" | "validated" | "published" | "retired";

/** The record of a wait forecast and its current status. */
export class WaitForecast {
  code: string;
  title: string;
  ownerId: string;
  summary: string;
  cohort: string;
  amount: number;
  status: WaitForecastStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    summary: string,
    cohort: string,
    amount: number,
    status: WaitForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.summary = summary;
    this.cohort = cohort;
    this.amount = amount;
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

  canMoveTo(next: WaitForecastStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): WaitForecast {
    return new WaitForecast(this.code, this.title, this.ownerId, this.summary, this.cohort, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait forecast in status created. */
export function newWaitForecast(code: string, title: string): WaitForecast {
  return new WaitForecast(code, title, "", "", "", 0, "created");
}
