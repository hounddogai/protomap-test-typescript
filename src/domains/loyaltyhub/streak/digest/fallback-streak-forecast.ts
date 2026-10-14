import * as text from "../../../../kit/text.js";

/** Where a fallback streak forecast is in its life cycle. */
export type FallbackStreakForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback streak forecast as the streak team keeps it. */
export class FallbackStreakForecast {
  code: string;
  title: string;
  clicks: number;
  score: number;
  discount: number;
  status: FallbackStreakForecastStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    score: number,
    discount: number,
    status: FallbackStreakForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.score = score;
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

  canMoveTo(next: FallbackStreakForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
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

  moveTo(next: FallbackStreakForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback streak forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.clicks - this.discount) * 100) / 100;
  }

  copy(): FallbackStreakForecast {
    return new FallbackStreakForecast(this.code, this.title, this.clicks, this.score, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback streak forecast in status open. */
export function newFallbackStreakForecast(code: string, title: string): FallbackStreakForecast {
  return new FallbackStreakForecast(code, title, 0, 0, 0, "open");
}
