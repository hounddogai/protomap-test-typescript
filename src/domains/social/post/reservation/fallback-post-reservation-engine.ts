import * as numbers from "../../../../kit/numbers.js";
import { FallbackPostReservation } from "./fallback-post-reservation.js";

/** One step of the fallback post reservation calculation. */
export interface FallbackPostReservationAdjuster {
  describe(): string;
  adjust(item: FallbackPostReservation, value: number): number;
}

export class PercentFallbackPostReservationAdjuster implements FallbackPostReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPostReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackPostReservationAdjuster implements FallbackPostReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPostReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFallbackPostReservationAdjuster implements FallbackPostReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPostReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryFallbackPostReservationAdjuster implements FallbackPostReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: FallbackPostReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFallbackPostReservationAdjuster implements FallbackPostReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPostReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback post reservation steps in order and keeps a trace of each. */
export class FallbackPostReservationEngine {
  steps: FallbackPostReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPostReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackPostReservation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackPostReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackPostReservationEngine(): FallbackPostReservationEngine {
  return new FallbackPostReservationEngine(
    [
      new PercentFallbackPostReservationAdjuster(14.1),
      new CapFallbackPostReservationAdjuster(19352),
      new RoundingFallbackPostReservationAdjuster(0.05),
      new CategoryFallbackPostReservationAdjuster(new Map<string, number>([["online", 1.4]])),
      new TieredFallbackPostReservationAdjuster([354, 2608, 3500, 7489], [0.93, 0.97, 0.81, 0.98]),
    ],
    [],
    4.1,
    60813.1,
  );
}
