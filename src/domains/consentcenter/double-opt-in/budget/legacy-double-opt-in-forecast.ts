import * as text from "../../../../kit/text.js";

/** Where a legacy double opt in forecast is in its life cycle. */
export type LegacyDoubleOptInForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One legacy double opt in forecast, with what the planners need to act on it. */
export class LegacyDoubleOptInForecast {
  code: string;
  title: string;
  threshold: number;
  sequence: number;
  externalRef: string;
  phone: string;
  region: string;
  durationMinutes: number;
  status: LegacyDoubleOptInForecastStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    sequence: number,
    externalRef: string,
    phone: string,
    region: string,
    durationMinutes: number,
    status: LegacyDoubleOptInForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.phone = phone;
    this.region = region;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: LegacyDoubleOptInForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyDoubleOptInForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy double opt in forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sequence - this.durationMinutes) * 100) / 100;
  }

  copy(): LegacyDoubleOptInForecast {
    return new LegacyDoubleOptInForecast(
      this.code,
      this.title,
      this.threshold,
      this.sequence,
      this.externalRef,
      this.phone,
      this.region,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy double opt in forecast in status idle. */
export function newLegacyDoubleOptInForecast(code: string, title: string): LegacyDoubleOptInForecast {
  return new LegacyDoubleOptInForecast(code, title, 0, 0, "", "", "", 0, "idle");
}
