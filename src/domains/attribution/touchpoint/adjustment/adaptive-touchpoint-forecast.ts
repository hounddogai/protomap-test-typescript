import * as text from "../../../../kit/text.js";

/** Where a adaptive touchpoint forecast is in its life cycle. */
export type AdaptiveTouchpointForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive touchpoint forecast. Its code is unique within a tenant. */
export class AdaptiveTouchpointForecast {
  code: string;
  name: string;
  unit: string;
  frequencyCap: number;
  conversionRate: number;
  description: string;
  sequence: number;
  clicks: number;
  currency: string;
  status: AdaptiveTouchpointForecastStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    frequencyCap: number,
    conversionRate: number,
    description: string,
    sequence: number,
    clicks: number,
    currency: string,
    status: AdaptiveTouchpointForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.description = description;
    this.sequence = sequence;
    this.clicks = clicks;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveTouchpointForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveTouchpointForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive touchpoint forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round(this.sequence * this.clicks * 100) / 100;
  }

  copy(): AdaptiveTouchpointForecast {
    return new AdaptiveTouchpointForecast(
      this.code,
      this.name,
      this.unit,
      this.frequencyCap,
      this.conversionRate,
      this.description,
      this.sequence,
      this.clicks,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive touchpoint forecast in status new. */
export function newAdaptiveTouchpointForecast(code: string, name: string): AdaptiveTouchpointForecast {
  return new AdaptiveTouchpointForecast(code, name, "", 0, 0, "", 0, 0, "", "new");
}
