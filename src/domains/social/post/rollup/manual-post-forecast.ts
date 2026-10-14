import * as text from "../../../../kit/text.js";

/** Where a manual post forecast is in its life cycle. */
export type ManualPostForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual post forecast, with what the planners need to act on it. */
export class ManualPostForecast {
  code: string;
  name: string;
  minimum: number;
  bid: number;
  source: string;
  batchSize: number;
  budget: number;
  status: ManualPostForecastStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    bid: number,
    source: string,
    batchSize: number,
    budget: number,
    status: ManualPostForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.bid = bid;
    this.source = source;
    this.batchSize = batchSize;
    this.budget = budget;
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

  canMoveTo(next: ManualPostForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
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

  moveTo(next: ManualPostForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual post forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual post forecast"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.minimum + this.bid) * 100) / 100;
  }

  copy(): ManualPostForecast {
    return new ManualPostForecast(
      this.code,
      this.name,
      this.minimum,
      this.bid,
      this.source,
      this.batchSize,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual post forecast in status open. */
export function newManualPostForecast(code: string, name: string): ManualPostForecast {
  return new ManualPostForecast(code, name, 0, 0, "", 0, 0, "open");
}
