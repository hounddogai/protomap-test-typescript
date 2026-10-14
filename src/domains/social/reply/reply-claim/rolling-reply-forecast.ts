import * as text from "../../../../kit/text.js";

/** Where a rolling reply forecast is in its life cycle. */
export type RollingReplyForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling reply forecast as the reply team keeps it. */
export class RollingReplyForecast {
  code: string;
  name: string;
  archived: boolean;
  campaignRef: string;
  score: number;
  graceDays: number;
  locale: string;
  title: string;
  channel: string;
  impressions: number;
  status: RollingReplyForecastStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    campaignRef: string,
    score: number,
    graceDays: number,
    locale: string,
    title: string,
    channel: string,
    impressions: number,
    status: RollingReplyForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.score = score;
    this.graceDays = graceDays;
    this.locale = locale;
    this.title = title;
    this.channel = channel;
    this.impressions = impressions;
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

  canMoveTo(next: RollingReplyForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
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

  moveTo(next: RollingReplyForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reply forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round(this.graceDays * this.score * 100) / 100;
  }

  copy(): RollingReplyForecast {
    return new RollingReplyForecast(
      this.code,
      this.name,
      this.archived,
      this.campaignRef,
      this.score,
      this.graceDays,
      this.locale,
      this.title,
      this.channel,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling reply forecast in status requested. */
export function newRollingReplyForecast(code: string, name: string): RollingReplyForecast {
  return new RollingReplyForecast(code, name, false, "", 0, 0, "", "", "", 0, "requested");
}
