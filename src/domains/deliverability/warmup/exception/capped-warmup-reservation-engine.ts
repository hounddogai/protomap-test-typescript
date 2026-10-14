import { CappedWarmupReservation } from "./capped-warmup-reservation.js";

/** One step of the capped warmup reservation calculation. */
export interface CappedWarmupReservationAdjuster {
  describe(): string;
  adjust(item: CappedWarmupReservation, value: number): number;
}

export class CappedWarmupReservationMarginOffsetAdjuster implements CappedWarmupReservationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: CappedWarmupReservation, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class PercentCappedWarmupReservationAdjuster implements CappedWarmupReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedWarmupReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedWarmupReservationAdjuster implements CappedWarmupReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedWarmupReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedWarmupReservationAdjuster implements CappedWarmupReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedWarmupReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped warmup reservation steps in order and keeps a trace of each. */
export class CappedWarmupReservationEngine {
  steps: CappedWarmupReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedWarmupReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedWarmupReservation): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: CappedWarmupReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedWarmupReservationEngine(): CappedWarmupReservationEngine {
  return new CappedWarmupReservationEngine(
    [
      new CappedWarmupReservationMarginOffsetAdjuster(1.46),
      new PercentCappedWarmupReservationAdjuster(17.3),
      new CapCappedWarmupReservationAdjuster(9839),
      new TieredCappedWarmupReservationAdjuster([6515, 8198], [0.99, 0.81]),
    ],
    [],
    4.6,
    19476.5,
  );
}
