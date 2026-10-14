import * as text from "../../../../kit/text.js";

/** Where a frequency forecast is in its life cycle. */
export type FrequencyForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a frequency forecast and its current status. */
export class FrequencyForecast {
  code: string;
  label: string;
  minimum: number;
  currency: string;
  notes: string;
  graceDays: number;
  unit: string;
  visible: boolean;
  campaignRef: string;
  country: string;
  status: FrequencyForecastStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    currency: string,
    notes: string,
    graceDays: number,
    unit: string,
    visible: boolean,
    campaignRef: string,
    country: string,
    status: FrequencyForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.currency = currency;
    this.notes = notes;
    this.graceDays = graceDays;
    this.unit = unit;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.country = country;
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

  canMoveTo(next: FrequencyForecastStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FrequencyForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.graceDays - this.minimum) * 100) / 100;
  }

  copy(): FrequencyForecast {
    return new FrequencyForecast(
      this.code,
      this.label,
      this.minimum,
      this.currency,
      this.notes,
      this.graceDays,
      this.unit,
      this.visible,
      this.campaignRef,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a frequency forecast in status new. */
export function newFrequencyForecast(code: string, label: string): FrequencyForecast {
  return new FrequencyForecast(code, label, 0, "", "", 0, "", false, "", "", "new");
}
