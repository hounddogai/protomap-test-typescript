import * as text from "../../../../kit/text.js";

/** Where a legacy insight forecast is in its life cycle. */
export type LegacyInsightForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One legacy insight forecast, with what the planners need to act on it. */
export class LegacyInsightForecast {
  code: string;
  label: string;
  category: string;
  capacity: number;
  cost: number;
  locale: string;
  durationMinutes: number;
  sequence: number;
  country: string;
  maximum: number;
  summary: string;
  status: LegacyInsightForecastStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    capacity: number,
    cost: number,
    locale: string,
    durationMinutes: number,
    sequence: number,
    country: string,
    maximum: number,
    summary: string,
    status: LegacyInsightForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.capacity = capacity;
    this.cost = cost;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.sequence = sequence;
    this.country = country;
    this.maximum = maximum;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyInsightForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyInsightForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy insight forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round(this.sequence * this.cost * 100) / 100;
  }

  copy(): LegacyInsightForecast {
    return new LegacyInsightForecast(
      this.code,
      this.label,
      this.category,
      this.capacity,
      this.cost,
      this.locale,
      this.durationMinutes,
      this.sequence,
      this.country,
      this.maximum,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy insight forecast in status draft. */
export function newLegacyInsightForecast(code: string, label: string): LegacyInsightForecast {
  return new LegacyInsightForecast(code, label, "", 0, 0, "", 0, 0, "", 0, "", "draft");
}
