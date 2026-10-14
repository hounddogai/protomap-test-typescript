import * as text from "../../../../kit/text.js";

/** Where a tiered tier forecast is in its life cycle. */
export type TieredTierForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One tiered tier forecast, with what the planners need to act on it. */
export class TieredTierForecast {
  code: string;
  name: string;
  retries: number;
  batchSize: number;
  attempts: number;
  description: string;
  minimum: number;
  journeyId: string;
  score: number;
  ratio: number;
  status: TieredTierForecastStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    batchSize: number,
    attempts: number,
    description: string,
    minimum: number,
    journeyId: string,
    score: number,
    ratio: number,
    status: TieredTierForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.batchSize = batchSize;
    this.attempts = attempts;
    this.description = description;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.score = score;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredTierForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredTierForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered tier forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered tier forecast"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.batchSize + this.score) * 100) / 100;
  }

  copy(): TieredTierForecast {
    return new TieredTierForecast(
      this.code,
      this.name,
      this.retries,
      this.batchSize,
      this.attempts,
      this.description,
      this.minimum,
      this.journeyId,
      this.score,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered tier forecast in status draft. */
export function newTieredTierForecast(code: string, name: string): TieredTierForecast {
  return new TieredTierForecast(code, name, 0, 0, 0, "", 0, "", 0, 0, "draft");
}
