import * as numbers from "../../../../kit/numbers.js";
import { GlobalPostReservation } from "./global-post-reservation.js";

/** One step of the global post reservation calculation. */
export interface GlobalPostReservationModifier {
  describe(): string;
  adjust(item: GlobalPostReservation, value: number): number;
}

export class GlobalPostReservationExpiresAtOffsetAdjuster implements GlobalPostReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: GlobalPostReservation, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class PercentGlobalPostReservationAdjuster implements GlobalPostReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalPostReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalPostReservationAdjuster implements GlobalPostReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalPostReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredGlobalPostReservationAdjuster implements GlobalPostReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalPostReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingGlobalPostReservationAdjuster implements GlobalPostReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPostReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global post reservation steps in order and keeps a trace of each. */
export class GlobalPostReservationEngine {
  steps: GlobalPostReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPostReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalPostReservation): number {
    let current = item.effectiveVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: GlobalPostReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalPostReservationEngine(): GlobalPostReservationEngine {
  return new GlobalPostReservationEngine(
    [
      new GlobalPostReservationExpiresAtOffsetAdjuster(1.43),
      new PercentGlobalPostReservationAdjuster(-18.7),
      new MinimumGlobalPostReservationAdjuster(32),
      new TieredGlobalPostReservationAdjuster([162, 6536, 8900], [1.19, 1.03, 1.14]),
      new RoundingGlobalPostReservationAdjuster(0.05),
    ],
    [],
    2.7,
    52905.9,
  );
}
