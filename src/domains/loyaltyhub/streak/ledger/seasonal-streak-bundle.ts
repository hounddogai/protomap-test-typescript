import * as text from "../../../../kit/text.js";

/** Where a seasonal streak bundle is in its life cycle. */
export type SeasonalStreakBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One seasonal streak bundle, with what the planners need to act on it. */
export class SeasonalStreakBundle {
  code: string;
  label: string;
  utmSource: string;
  category: string;
  locale: string;
  limit: number;
  attempts: number;
  windowDays: number;
  conversionRate: number;
  status: SeasonalStreakBundleStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    category: string,
    locale: string,
    limit: number,
    attempts: number,
    windowDays: number,
    conversionRate: number,
    status: SeasonalStreakBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.category = category;
    this.locale = locale;
    this.limit = limit;
    this.attempts = attempts;
    this.windowDays = windowDays;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: SeasonalStreakBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalStreakBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal streak bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedExposure(): number {
    return Math.round(this.limit * this.conversionRate * 100) / 100;
  }

  copy(): SeasonalStreakBundle {
    return new SeasonalStreakBundle(
      this.code,
      this.label,
      this.utmSource,
      this.category,
      this.locale,
      this.limit,
      this.attempts,
      this.windowDays,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal streak bundle in status proposed. */
export function newSeasonalStreakBundle(code: string, label: string): SeasonalStreakBundle {
  return new SeasonalStreakBundle(code, label, "", "", "", 0, 0, 0, 0, "proposed");
}
