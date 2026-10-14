import * as text from "../../../../kit/text.js";

/** Where a window forecast is in its life cycle. */
export type WindowForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One window forecast, with what the planners need to act on it. */
export class WindowForecast {
  code: string;
  title: string;
  locale: string;
  utmSource: string;
  unit: string;
  createdAt: number;
  weight: number;
  bid: number;
  minimum: number;
  status: WindowForecastStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    utmSource: string,
    unit: string,
    createdAt: number,
    weight: number,
    bid: number,
    minimum: number,
    status: WindowForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.utmSource = utmSource;
    this.unit = unit;
    this.createdAt = createdAt;
    this.weight = weight;
    this.bid = bid;
    this.minimum = minimum;
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

  canMoveTo(next: WindowForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WindowForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"window forecast"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.bid - this.createdAt) * 100) / 100;
  }

  copy(): WindowForecast {
    return new WindowForecast(
      this.code,
      this.title,
      this.locale,
      this.utmSource,
      this.unit,
      this.createdAt,
      this.weight,
      this.bid,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a window forecast in status planned. */
export function newWindowForecast(code: string, title: string): WindowForecast {
  return new WindowForecast(code, title, "", "", "", 0, 0, 0, 0, "planned");
}
