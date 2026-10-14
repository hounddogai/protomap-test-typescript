import * as text from "../../../../kit/text.js";

/** Where a scheduled nudge forecast is in its life cycle. */
export type ScheduledNudgeForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled nudge forecast, with what the planners need to act on it. */
export class ScheduledNudgeForecast {
  code: string;
  title: string;
  phone: string;
  limit: number;
  visible: boolean;
  threshold: number;
  pinned: boolean;
  minimum: number;
  attempts: number;
  name: string;
  country: string;
  status: ScheduledNudgeForecastStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    limit: number,
    visible: boolean,
    threshold: number,
    pinned: boolean,
    minimum: number,
    attempts: number,
    name: string,
    country: string,
    status: ScheduledNudgeForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.limit = limit;
    this.visible = visible;
    this.threshold = threshold;
    this.pinned = pinned;
    this.minimum = minimum;
    this.attempts = attempts;
    this.name = name;
    this.country = country;
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

  canMoveTo(next: ScheduledNudgeForecastStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: ScheduledNudgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled nudge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.limit + this.minimum) * 100) / 100;
  }

  copy(): ScheduledNudgeForecast {
    return new ScheduledNudgeForecast(
      this.code,
      this.title,
      this.phone,
      this.limit,
      this.visible,
      this.threshold,
      this.pinned,
      this.minimum,
      this.attempts,
      this.name,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled nudge forecast in status open. */
export function newScheduledNudgeForecast(code: string, title: string): ScheduledNudgeForecast {
  return new ScheduledNudgeForecast(code, title, "", 0, false, 0, false, 0, 0, "", "", "open");
}
