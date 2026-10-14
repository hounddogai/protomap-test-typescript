import * as text from "../../../../kit/text.js";

/** Where a conversion forecast is in its life cycle. */
export type ConversionForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a conversion forecast and its current status. */
export class ConversionForecast {
  code: string;
  label: string;
  openRate: number;
  archived: boolean;
  source: string;
  locale: string;
  ceiling: number;
  unit: string;
  endsAt: number;
  reviewer: string;
  status: ConversionForecastStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    archived: boolean,
    source: string,
    locale: string,
    ceiling: number,
    unit: string,
    endsAt: number,
    reviewer: string,
    status: ConversionForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.archived = archived;
    this.source = source;
    this.locale = locale;
    this.ceiling = ceiling;
    this.unit = unit;
    this.endsAt = endsAt;
    this.reviewer = reviewer;
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

  canMoveTo(next: ConversionForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ConversionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"conversion forecast"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.endsAt - this.ceiling) * 100) / 100;
  }

  copy(): ConversionForecast {
    return new ConversionForecast(
      this.code,
      this.label,
      this.openRate,
      this.archived,
      this.source,
      this.locale,
      this.ceiling,
      this.unit,
      this.endsAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a conversion forecast in status proposed. */
export function newConversionForecast(code: string, label: string): ConversionForecast {
  return new ConversionForecast(code, label, 0, false, "", "", 0, "", 0, "", "proposed");
}
