import * as text from "../../../../kit/text.js";

/** Where a seasonal reward forecast is in its life cycle. */
export type SeasonalRewardForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal reward forecast as the reward team keeps it. */
export class SeasonalRewardForecast {
  code: string;
  label: string;
  reviewer: string;
  checksum: string;
  locale: string;
  priority: number;
  version: number;
  summary: string;
  utmSource: string;
  timezone: string;
  status: SeasonalRewardForecastStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    checksum: string,
    locale: string,
    priority: number,
    version: number,
    summary: string,
    utmSource: string,
    timezone: string,
    status: SeasonalRewardForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.locale = locale;
    this.priority = priority;
    this.version = version;
    this.summary = summary;
    this.utmSource = utmSource;
    this.timezone = timezone;
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

  canMoveTo(next: SeasonalRewardForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalRewardForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.version + this.priority) * 100) / 100;
  }

  copy(): SeasonalRewardForecast {
    return new SeasonalRewardForecast(
      this.code,
      this.label,
      this.reviewer,
      this.checksum,
      this.locale,
      this.priority,
      this.version,
      this.summary,
      this.utmSource,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal reward forecast in status draft. */
export function newSeasonalRewardForecast(code: string, label: string): SeasonalRewardForecast {
  return new SeasonalRewardForecast(code, label, "", "", "", 0, 0, "", "", "", "draft");
}
