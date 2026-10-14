/**
 * The adaptive model forecast records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive model forecast is in its life cycle. */
export type AdaptiveModelForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One adaptive model forecast, with what the planners need to act on it. */
export class AdaptiveModelForecast {
  code: string;
  label: string;
  locale: string;
  floorValue: number;
  batchSize: number;
  ratio: number;
  region: string;
  rate: number;
  status: AdaptiveModelForecastStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    floorValue: number,
    batchSize: number,
    ratio: number,
    region: string,
    rate: number,
    status: AdaptiveModelForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.floorValue = floorValue;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.region = region;
    this.rate = rate;
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

  canMoveTo(next: AdaptiveModelForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveModelForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive model forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.batchSize - this.ratio) * 100) / 100;
  }

  copy(): AdaptiveModelForecast {
    return new AdaptiveModelForecast(
      this.code,
      this.label,
      this.locale,
      this.floorValue,
      this.batchSize,
      this.ratio,
      this.region,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive model forecast in status idle. */
export function newAdaptiveModelForecast(code: string, label: string): AdaptiveModelForecast {
  return new AdaptiveModelForecast(code, label, "", 0, 0, 0, "", 0, "idle");
}
