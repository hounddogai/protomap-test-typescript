import * as numbers from "../../../../kit/numbers.js";
import { FallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

/** One step of the fallback enrollment baseline calculation. */
export interface FallbackEnrollmentBaselineModifier {
  describe(): string;
  adjust(item: FallbackEnrollmentBaseline, value: number): number;
}

export class RoundingFallbackEnrollmentBaselineAdjuster implements FallbackEnrollmentBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackEnrollmentBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackEnrollmentBaselineAdjuster implements FallbackEnrollmentBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackEnrollmentBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentFallbackEnrollmentBaselineAdjuster implements FallbackEnrollmentBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackEnrollmentBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback enrollment baseline steps in order and keeps a trace of each. */
export class FallbackEnrollmentBaselineEngine {
  steps: FallbackEnrollmentBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackEnrollmentBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackEnrollmentBaseline): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: FallbackEnrollmentBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackEnrollmentBaselineEngine(): FallbackEnrollmentBaselineEngine {
  return new FallbackEnrollmentBaselineEngine(
    [
      new RoundingFallbackEnrollmentBaselineAdjuster(0.25),
      new TieredFallbackEnrollmentBaselineAdjuster([2513, 7125], [1.05, 0.95]),
      new PercentFallbackEnrollmentBaselineAdjuster(-20.7),
    ],
    [],
    0.2,
    59085.8,
  );
}
