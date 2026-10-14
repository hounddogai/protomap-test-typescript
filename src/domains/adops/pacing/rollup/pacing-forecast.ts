import * as text from "../../../../kit/text.js";

/** Where a pacing forecast is in its life cycle. */
export type PacingForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pacing forecast, with what the planners need to act on it. */
export class PacingForecast {
  code: string;
  label: string;
  createdAt: number;
  frequencyCap: number;
  quantity: number;
  segment: string;
  pinned: boolean;
  budget: number;
  locale: string;
  windowDays: number;
  status: PacingForecastStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    frequencyCap: number,
    quantity: number,
    segment: string,
    pinned: boolean,
    budget: number,
    locale: string,
    windowDays: number,
    status: PacingForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.segment = segment;
    this.pinned = pinned;
    this.budget = budget;
    this.locale = locale;
    this.windowDays = windowDays;
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

  canMoveTo(next: PacingForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: PacingForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round((this.frequencyCap - this.budget) * 100) / 100;
  }

  copy(): PacingForecast {
    return new PacingForecast(
      this.code,
      this.label,
      this.createdAt,
      this.frequencyCap,
      this.quantity,
      this.segment,
      this.pinned,
      this.budget,
      this.locale,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pacing forecast in status proposed. */
export function newPacingForecast(code: string, label: string): PacingForecast {
  return new PacingForecast(code, label, 0, 0, 0, "", false, 0, "", 0, "proposed");
}
