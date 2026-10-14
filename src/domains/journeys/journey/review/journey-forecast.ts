import * as text from "../../../../kit/text.js";

/** Where a journey forecast is in its life cycle. */
export type JourneyForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A journey forecast. Its code is unique within a tenant. */
export class JourneyForecast {
  code: string;
  title: string;
  revision: number;
  retries: number;
  rate: number;
  graceDays: number;
  endsAt: number;
  status: JourneyForecastStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    retries: number,
    rate: number,
    graceDays: number,
    endsAt: number,
    status: JourneyForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.retries = retries;
    this.rate = rate;
    this.graceDays = graceDays;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: JourneyForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netExposure(): number {
    return Math.round((this.revision + this.rate) * 100) / 100;
  }

  copy(): JourneyForecast {
    return new JourneyForecast(
      this.code,
      this.title,
      this.revision,
      this.retries,
      this.rate,
      this.graceDays,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a journey forecast in status idle. */
export function newJourneyForecast(code: string, title: string): JourneyForecast {
  return new JourneyForecast(code, title, 0, 0, 0, 0, 0, "idle");
}
