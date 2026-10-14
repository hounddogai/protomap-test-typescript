import * as text from "../../../../kit/text.js";

/** Where a rolling step forecast is in its life cycle. */
export type RollingStepForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling step forecast. Its code is unique within a tenant. */
export class RollingStepForecast {
  code: string;
  label: string;
  pinned: boolean;
  cost: number;
  conversionRate: number;
  unit: string;
  margin: number;
  rate: number;
  startsAt: number;
  status: RollingStepForecastStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    cost: number,
    conversionRate: number,
    unit: string,
    margin: number,
    rate: number,
    startsAt: number,
    status: RollingStepForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.cost = cost;
    this.conversionRate = conversionRate;
    this.unit = unit;
    this.margin = margin;
    this.rate = rate;
    this.startsAt = startsAt;
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

  canMoveTo(next: RollingStepForecastStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
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

  moveTo(next: RollingStepForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling step forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.rate - this.cost) * 100) / 100;
  }

  copy(): RollingStepForecast {
    return new RollingStepForecast(
      this.code,
      this.label,
      this.pinned,
      this.cost,
      this.conversionRate,
      this.unit,
      this.margin,
      this.rate,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling step forecast in status open. */
export function newRollingStepForecast(code: string, label: string): RollingStepForecast {
  return new RollingStepForecast(code, label, false, 0, 0, "", 0, 0, 0, "open");
}
