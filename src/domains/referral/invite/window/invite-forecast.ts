import * as text from "../../../../kit/text.js";

/** Where a invite forecast is in its life cycle. */
export type InviteForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One invite forecast, with what the planners need to act on it. */
export class InviteForecast {
  code: string;
  title: string;
  rate: number;
  cohort: string;
  reviewer: string;
  country: string;
  region: string;
  utmSource: string;
  status: InviteForecastStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    cohort: string,
    reviewer: string,
    country: string,
    region: string,
    utmSource: string,
    status: InviteForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.country = country;
    this.region = region;
    this.utmSource = utmSource;
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

  canMoveTo(next: InviteForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"invite forecast"} ${this.code}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): InviteForecast {
    return new InviteForecast(
      this.code,
      this.title,
      this.rate,
      this.cohort,
      this.reviewer,
      this.country,
      this.region,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a invite forecast in status open. */
export function newInviteForecast(code: string, title: string): InviteForecast {
  return new InviteForecast(code, title, 0, "", "", "", "", "", "open");
}
