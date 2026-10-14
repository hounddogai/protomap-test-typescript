/**
 * The mention forecast records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention forecast is in its life cycle. */
export type MentionForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A mention forecast. Its code is unique within a tenant. */
export class MentionForecast {
  code: string;
  name: string;
  phone: string;
  rate: number;
  audienceId: string;
  summary: string;
  ceiling: number;
  limit: number;
  status: MentionForecastStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    rate: number,
    audienceId: string,
    summary: string,
    ceiling: number,
    limit: number,
    status: MentionForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.rate = rate;
    this.audienceId = audienceId;
    this.summary = summary;
    this.ceiling = ceiling;
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

  canMoveTo(next: MentionForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: MentionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"mention forecast"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.rate + this.ceiling) * 100) / 100;
  }

  copy(): MentionForecast {
    return new MentionForecast(
      this.code,
      this.name,
      this.phone,
      this.rate,
      this.audienceId,
      this.summary,
      this.ceiling,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a mention forecast in status proposed. */
export function newMentionForecast(code: string, name: string): MentionForecast {
  return new MentionForecast(code, name, "", 0, "", "", 0, 0, "proposed");
}
