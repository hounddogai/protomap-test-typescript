import * as text from "../../../../kit/text.js";

/** Where a model forecast is in its life cycle. */
export type ModelForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a model forecast and its current status. */
export class ModelForecast {
  code: string;
  name: string;
  windowDays: number;
  audienceId: string;
  locale: string;
  durationMinutes: number;
  ceiling: number;
  score: number;
  variant: string;
  status: ModelForecastStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    audienceId: string,
    locale: string,
    durationMinutes: number,
    ceiling: number,
    score: number,
    variant: string,
    status: ModelForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.ceiling = ceiling;
    this.score = score;
    this.variant = variant;
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

  canMoveTo(next: ModelForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netTotal(): number {
    return Math.round(this.score * this.ceiling * 100) / 100;
  }

  copy(): ModelForecast {
    return new ModelForecast(
      this.code,
      this.name,
      this.windowDays,
      this.audienceId,
      this.locale,
      this.durationMinutes,
      this.ceiling,
      this.score,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a model forecast in status planned. */
export function newModelForecast(code: string, name: string): ModelForecast {
  return new ModelForecast(code, name, 0, "", "", 0, 0, 0, "", "planned");
}
