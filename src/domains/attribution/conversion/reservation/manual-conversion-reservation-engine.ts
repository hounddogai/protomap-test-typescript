import * as numbers from "../../../../kit/numbers.js";
import { ManualConversionReservation } from "./manual-conversion-reservation.js";

/** One step of the manual conversion reservation calculation. */
export interface ManualConversionReservationModifier {
  describe(): string;
  adjust(item: ManualConversionReservation, value: number): number;
}

export class ManualConversionReservationClicksOffsetAdjuster implements ManualConversionReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: ManualConversionReservation, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class TieredManualConversionReservationAdjuster implements ManualConversionReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualConversionReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumManualConversionReservationAdjuster implements ManualConversionReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualConversionReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentManualConversionReservationAdjuster implements ManualConversionReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualConversionReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapManualConversionReservationAdjuster implements ManualConversionReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualConversionReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual conversion reservation steps in order and keeps a trace of each. */
export class ManualConversionReservationEngine {
  steps: ManualConversionReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualConversionReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualConversionReservation): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ManualConversionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualConversionReservationEngine(): ManualConversionReservationEngine {
  return new ManualConversionReservationEngine(
    [
      new ManualConversionReservationClicksOffsetAdjuster(0.92),
      new TieredManualConversionReservationAdjuster([4675, 5602, 8759, 9055], [1.14, 0.9, 0.92, 1.19]),
      new MinimumManualConversionReservationAdjuster(30.5),
      new PercentManualConversionReservationAdjuster(20),
      new CapManualConversionReservationAdjuster(35351),
    ],
    [],
    0.2,
    51249.8,
  );
}
