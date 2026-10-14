import * as text from "../../../../kit/text.js";

/** Where a double opt in forecast is in its life cycle. */
export type DoubleOptInForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A double opt in forecast as the double opt in team keeps it. */
export class DoubleOptInForecast {
  code: string;
  title: string;
  journeyId: string;
  threshold: number;
  ratio: number;
  clicks: number;
  impressions: number;
  updatedAt: number;
  region: string;
  status: DoubleOptInForecastStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    threshold: number,
    ratio: number,
    clicks: number,
    impressions: number,
    updatedAt: number,
    region: string,
    status: DoubleOptInForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.ratio = ratio;
    this.clicks = clicks;
    this.impressions = impressions;
    this.updatedAt = updatedAt;
    this.region = region;
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

  canMoveTo(next: DoubleOptInForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DoubleOptInForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round((this.ratio + this.clicks) * 100) / 100;
  }

  copy(): DoubleOptInForecast {
    return new DoubleOptInForecast(
      this.code,
      this.title,
      this.journeyId,
      this.threshold,
      this.ratio,
      this.clicks,
      this.impressions,
      this.updatedAt,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a double opt in forecast in status proposed. */
export function newDoubleOptInForecast(code: string, title: string): DoubleOptInForecast {
  return new DoubleOptInForecast(code, title, "", 0, 0, 0, 0, 0, "", "proposed");
}
