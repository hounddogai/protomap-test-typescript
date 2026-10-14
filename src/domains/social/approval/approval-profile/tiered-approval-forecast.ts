import * as text from "../../../../kit/text.js";

/** Where a tiered approval forecast is in its life cycle. */
export type TieredApprovalForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered approval forecast as the approval team keeps it. */
export class TieredApprovalForecast {
  code: string;
  label: string;
  endsAt: number;
  impressions: number;
  region: string;
  locale: string;
  channel: string;
  conversionRate: number;
  startsAt: number;
  score: number;
  attempts: number;
  status: TieredApprovalForecastStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    impressions: number,
    region: string,
    locale: string,
    channel: string,
    conversionRate: number,
    startsAt: number,
    score: number,
    attempts: number,
    status: TieredApprovalForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.region = region;
    this.locale = locale;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.score = score;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredApprovalForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredApprovalForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered approval forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered approval forecast"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.score - this.impressions) * 100) / 100;
  }

  copy(): TieredApprovalForecast {
    return new TieredApprovalForecast(
      this.code,
      this.label,
      this.endsAt,
      this.impressions,
      this.region,
      this.locale,
      this.channel,
      this.conversionRate,
      this.startsAt,
      this.score,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered approval forecast in status requested. */
export function newTieredApprovalForecast(code: string, label: string): TieredApprovalForecast {
  return new TieredApprovalForecast(code, label, 0, 0, "", "", "", 0, 0, 0, 0, "requested");
}
