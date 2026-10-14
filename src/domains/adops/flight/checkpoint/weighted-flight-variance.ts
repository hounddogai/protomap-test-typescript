import * as text from "../../../../kit/text.js";

/** Where a weighted flight variance is in its life cycle. */
export type WeightedFlightVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted flight variance as the flight team keeps it. */
export class WeightedFlightVariance {
  code: string;
  title: string;
  startsAt: number;
  region: string;
  category: string;
  floorValue: number;
  score: number;
  limit: number;
  checksum: string;
  status: WeightedFlightVarianceStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    region: string,
    category: string,
    floorValue: number,
    score: number,
    limit: number,
    checksum: string,
    status: WeightedFlightVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.region = region;
    this.category = category;
    this.floorValue = floorValue;
    this.score = score;
    this.limit = limit;
    this.checksum = checksum;
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

  canMoveTo(next: WeightedFlightVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedFlightVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted flight variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted flight variance"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.startsAt + this.floorValue) * 100) / 100;
  }

  copy(): WeightedFlightVariance {
    return new WeightedFlightVariance(
      this.code,
      this.title,
      this.startsAt,
      this.region,
      this.category,
      this.floorValue,
      this.score,
      this.limit,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted flight variance in status draft. */
export function newWeightedFlightVariance(code: string, title: string): WeightedFlightVariance {
  return new WeightedFlightVariance(code, title, 0, "", "", 0, 0, 0, "", "draft");
}
