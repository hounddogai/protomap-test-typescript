import * as text from "../../../../kit/text.js";

/** Where a tiered queue forecast is in its life cycle. */
export type TieredQueueForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered queue forecast and its current status. */
export class TieredQueueForecast {
  code: string;
  title: string;
  pinned: boolean;
  budget: number;
  archived: boolean;
  locale: string;
  variant: string;
  expiresAt: number;
  status: TieredQueueForecastStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    budget: number,
    archived: boolean,
    locale: string,
    variant: string,
    expiresAt: number,
    status: TieredQueueForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.budget = budget;
    this.archived = archived;
    this.locale = locale;
    this.variant = variant;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: TieredQueueForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredQueueForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered queue forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered queue forecast"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.expiresAt + this.budget) * 100) / 100;
  }

  copy(): TieredQueueForecast {
    return new TieredQueueForecast(
      this.code,
      this.title,
      this.pinned,
      this.budget,
      this.archived,
      this.locale,
      this.variant,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered queue forecast in status proposed. */
export function newTieredQueueForecast(code: string, title: string): TieredQueueForecast {
  return new TieredQueueForecast(code, title, false, 0, false, "", "", 0, "proposed");
}
