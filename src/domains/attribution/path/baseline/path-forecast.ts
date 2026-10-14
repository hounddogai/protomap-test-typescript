import * as text from "../../../../kit/text.js";

/** Where a path forecast is in its life cycle. */
export type PathForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** One path forecast, with what the planners need to act on it. */
export class PathForecast {
  code: string;
  name: string;
  locale: string;
  attempts: number;
  region: string;
  ceiling: number;
  visible: boolean;
  summary: string;
  score: number;
  status: PathForecastStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    attempts: number,
    region: string,
    ceiling: number,
    visible: boolean,
    summary: string,
    score: number,
    status: PathForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.attempts = attempts;
    this.region = region;
    this.ceiling = ceiling;
    this.visible = visible;
    this.summary = summary;
    this.score = score;
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

  canMoveTo(next: PathForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: PathForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.ceiling + this.attempts) * 100) / 100;
  }

  copy(): PathForecast {
    return new PathForecast(
      this.code,
      this.name,
      this.locale,
      this.attempts,
      this.region,
      this.ceiling,
      this.visible,
      this.summary,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a path forecast in status new. */
export function newPathForecast(code: string, name: string): PathForecast {
  return new PathForecast(code, name, "", 0, "", 0, false, "", 0, "new");
}
