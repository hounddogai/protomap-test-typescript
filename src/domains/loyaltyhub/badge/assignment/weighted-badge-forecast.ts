import * as text from "../../../../kit/text.js";

/** Where a weighted badge forecast is in its life cycle. */
export type WeightedBadgeForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted badge forecast as the badge team keeps it. */
export class WeightedBadgeForecast {
  code: string;
  label: string;
  cohort: string;
  locale: string;
  margin: number;
  minimum: number;
  discount: number;
  status: WeightedBadgeForecastStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    locale: string,
    margin: number,
    minimum: number,
    discount: number,
    status: WeightedBadgeForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.locale = locale;
    this.margin = margin;
    this.minimum = minimum;
    this.discount = discount;
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

  canMoveTo(next: WeightedBadgeForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedBadgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted badge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted badge forecast"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.margin - this.minimum) * 100) / 100;
  }

  copy(): WeightedBadgeForecast {
    return new WeightedBadgeForecast(
      this.code,
      this.label,
      this.cohort,
      this.locale,
      this.margin,
      this.minimum,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted badge forecast in status open. */
export function newWeightedBadgeForecast(code: string, label: string): WeightedBadgeForecast {
  return new WeightedBadgeForecast(code, label, "", "", 0, 0, 0, "open");
}
