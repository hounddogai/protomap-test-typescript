import * as text from "../../../../kit/text.js";

/** Where a seasonal cohort target is in its life cycle. */
export type SeasonalCohortTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal cohort target, with what the planners need to act on it. */
export class SeasonalCohortTarget {
  code: string;
  title: string;
  country: string;
  cost: number;
  batchSize: number;
  ceiling: number;
  sequence: number;
  maximum: number;
  floorValue: number;
  graceDays: number;
  region: string;
  status: SeasonalCohortTargetStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    cost: number,
    batchSize: number,
    ceiling: number,
    sequence: number,
    maximum: number,
    floorValue: number,
    graceDays: number,
    region: string,
    status: SeasonalCohortTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.cost = cost;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.sequence = sequence;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.graceDays = graceDays;
    this.region = region;
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

  canMoveTo(next: SeasonalCohortTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalCohortTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal cohort target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.ceiling + this.batchSize) * 100) / 100;
  }

  copy(): SeasonalCohortTarget {
    return new SeasonalCohortTarget(
      this.code,
      this.title,
      this.country,
      this.cost,
      this.batchSize,
      this.ceiling,
      this.sequence,
      this.maximum,
      this.floorValue,
      this.graceDays,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal cohort target in status draft. */
export function newSeasonalCohortTarget(code: string, title: string): SeasonalCohortTarget {
  return new SeasonalCohortTarget(code, title, "", 0, 0, 0, 0, 0, 0, 0, "", "draft");
}
