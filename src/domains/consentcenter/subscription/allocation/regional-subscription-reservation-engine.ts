import * as numbers from "../../../../kit/numbers.js";
import { RegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

/** One step of the regional subscription reservation calculation. */
export interface RegionalSubscriptionReservationAdjuster {
  describe(): string;
  adjust(item: RegionalSubscriptionReservation, value: number): number;
}

export class CapRegionalSubscriptionReservationAdjuster implements RegionalSubscriptionReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalSubscriptionReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRegionalSubscriptionReservationAdjuster implements RegionalSubscriptionReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSubscriptionReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRegionalSubscriptionReservationAdjuster implements RegionalSubscriptionReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSubscriptionReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionalSubscriptionReservationCreatedAtOffsetAdjuster implements RegionalSubscriptionReservationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: RegionalSubscriptionReservation, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the regional subscription reservation steps in order and keeps a trace of each. */
export class RegionalSubscriptionReservationEngine {
  steps: RegionalSubscriptionReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSubscriptionReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalSubscriptionReservation): number {
    let current = item.weightedTotal();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: RegionalSubscriptionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalSubscriptionReservationEngine(): RegionalSubscriptionReservationEngine {
  return new RegionalSubscriptionReservationEngine(
    [
      new CapRegionalSubscriptionReservationAdjuster(11525),
      new RoundingRegionalSubscriptionReservationAdjuster(0.1),
      new TieredRegionalSubscriptionReservationAdjuster([1356, 3941, 7140, 7676], [0.82, 0.85, 1.13, 0.89]),
      new RegionalSubscriptionReservationCreatedAtOffsetAdjuster(0.28),
    ],
    [],
    2.9,
    37308.7,
  );
}
