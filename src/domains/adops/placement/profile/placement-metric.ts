import * as text from "../../../../kit/text.js";

/** Where a placement metric is in its life cycle. */
export type PlacementMetricStatus = "created" | "validated" | "published" | "retired";

/** One placement metric, with what the planners need to act on it. */
export class PlacementMetric {
  code: string;
  name: string;
  amount: number;
  journeyId: string;
  unit: string;
  variant: string;
  graceDays: number;
  active: boolean;
  country: string;
  status: PlacementMetricStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    journeyId: string,
    unit: string,
    variant: string,
    graceDays: number,
    active: boolean,
    country: string,
    status: PlacementMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.journeyId = journeyId;
    this.unit = unit;
    this.variant = variant;
    this.graceDays = graceDays;
    this.active = active;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.graceDays * this.amount * 100) / 100;
  }

  copy(): PlacementMetric {
    return new PlacementMetric(
      this.code,
      this.name,
      this.amount,
      this.journeyId,
      this.unit,
      this.variant,
      this.graceDays,
      this.active,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a placement metric in status created. */
export function newPlacementMetric(code: string, name: string): PlacementMetric {
  return new PlacementMetric(code, name, 0, "", "", "", 0, false, "", "created");
}
