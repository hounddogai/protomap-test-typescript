import * as text from "../../../../kit/text.js";

/** Where a level forecast is in its life cycle. */
export type LevelForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A level forecast. Its code is unique within a tenant. */
export class LevelForecast {
  code: string;
  label: string;
  conversionRate: number;
  visible: boolean;
  endsAt: number;
  windowDays: number;
  graceDays: number;
  currency: string;
  notes: string;
  status: LevelForecastStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    visible: boolean,
    endsAt: number,
    windowDays: number,
    graceDays: number,
    currency: string,
    notes: string,
    status: LevelForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.visible = visible;
    this.endsAt = endsAt;
    this.windowDays = windowDays;
    this.graceDays = graceDays;
    this.currency = currency;
    this.notes = notes;
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

  canMoveTo(next: LevelForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LevelForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"level forecast"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.windowDays + this.conversionRate) * 100) / 100;
  }

  copy(): LevelForecast {
    return new LevelForecast(
      this.code,
      this.label,
      this.conversionRate,
      this.visible,
      this.endsAt,
      this.windowDays,
      this.graceDays,
      this.currency,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level forecast in status planned. */
export function newLevelForecast(code: string, label: string): LevelForecast {
  return new LevelForecast(code, label, 0, false, 0, 0, 0, "", "", "planned");
}
