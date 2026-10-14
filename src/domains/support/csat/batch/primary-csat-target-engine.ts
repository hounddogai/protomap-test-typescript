import * as numbers from "../../../../kit/numbers.js";
import { PrimaryCsatTarget } from "./primary-csat-target.js";

/** One step of the primary csat target calculation. */
export interface PrimaryCsatTargetAdjuster {
  describe(): string;
  adjust(item: PrimaryCsatTarget, value: number): number;
}

export class CountryPrimaryCsatTargetAdjuster implements PrimaryCsatTargetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PrimaryCsatTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPrimaryCsatTargetAdjuster implements PrimaryCsatTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryCsatTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPrimaryCsatTargetAdjuster implements PrimaryCsatTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryCsatTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary csat target steps in order and keeps a trace of each. */
export class PrimaryCsatTargetEngine {
  steps: PrimaryCsatTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryCsatTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryCsatTarget): number {
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

  evaluateAll(items: PrimaryCsatTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryCsatTargetEngine(): PrimaryCsatTargetEngine {
  return new PrimaryCsatTargetEngine(
    [
      new CountryPrimaryCsatTargetAdjuster(
        new Map<string, number>([["south", 0.79], ["east", 0.88], ["retail", 0.79]]),
      ),
      new MinimumPrimaryCsatTargetAdjuster(13.5),
      new RoundingPrimaryCsatTargetAdjuster(0.5),
    ],
    [],
    3.2,
    44233.2,
  );
}
