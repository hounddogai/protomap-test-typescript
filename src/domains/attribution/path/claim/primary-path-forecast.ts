import * as text from "../../../../kit/text.js";

/** Where a primary path forecast is in its life cycle. */
export type PrimaryPathForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One primary path forecast, with what the planners need to act on it. */
export class PrimaryPathForecast {
  code: string;
  title: string;
  priority: number;
  country: string;
  sequence: number;
  channel: string;
  timezone: string;
  createdAt: number;
  segment: string;
  status: PrimaryPathForecastStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    country: string,
    sequence: number,
    channel: string,
    timezone: string,
    createdAt: number,
    segment: string,
    status: PrimaryPathForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.country = country;
    this.sequence = sequence;
    this.channel = channel;
    this.timezone = timezone;
    this.createdAt = createdAt;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryPathForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPathForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary path forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary path forecast"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.sequence + this.priority) * 100) / 100;
  }

  copy(): PrimaryPathForecast {
    return new PrimaryPathForecast(
      this.code,
      this.title,
      this.priority,
      this.country,
      this.sequence,
      this.channel,
      this.timezone,
      this.createdAt,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary path forecast in status planned. */
export function newPrimaryPathForecast(code: string, title: string): PrimaryPathForecast {
  return new PrimaryPathForecast(code, title, 0, "", 0, "", "", 0, "", "planned");
}
