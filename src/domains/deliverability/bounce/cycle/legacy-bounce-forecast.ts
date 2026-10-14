import * as text from "../../../../kit/text.js";

/** Where a legacy bounce forecast is in its life cycle. */
export type LegacyBounceForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One legacy bounce forecast, with what the planners need to act on it. */
export class LegacyBounceForecast {
  code: string;
  name: string;
  country: string;
  priority: number;
  description: string;
  phone: string;
  clicks: number;
  rate: number;
  journeyId: string;
  active: boolean;
  ceiling: number;
  status: LegacyBounceForecastStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    priority: number,
    description: string,
    phone: string,
    clicks: number,
    rate: number,
    journeyId: string,
    active: boolean,
    ceiling: number,
    status: LegacyBounceForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.priority = priority;
    this.description = description;
    this.phone = phone;
    this.clicks = clicks;
    this.rate = rate;
    this.journeyId = journeyId;
    this.active = active;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyBounceForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyBounceForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy bounce forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netTotal(): number {
    return Math.round(this.rate * this.ceiling * 100) / 100;
  }

  copy(): LegacyBounceForecast {
    return new LegacyBounceForecast(
      this.code,
      this.name,
      this.country,
      this.priority,
      this.description,
      this.phone,
      this.clicks,
      this.rate,
      this.journeyId,
      this.active,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy bounce forecast in status open. */
export function newLegacyBounceForecast(code: string, name: string): LegacyBounceForecast {
  return new LegacyBounceForecast(code, name, "", 0, "", "", 0, 0, "", false, 0, "open");
}
