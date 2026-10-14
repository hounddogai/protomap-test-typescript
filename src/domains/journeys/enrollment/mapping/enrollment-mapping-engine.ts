import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentMapping } from "./enrollment-mapping.js";

/** One step of the enrollment mapping calculation. */
export interface EnrollmentMappingAdjuster {
  describe(): string;
  adjust(item: EnrollmentMapping, value: number): number;
}

export class EnrollmentMappingWindowDaysOffsetAdjuster implements EnrollmentMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: EnrollmentMapping, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class TieredEnrollmentMappingAdjuster implements EnrollmentMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumEnrollmentMappingAdjuster implements EnrollmentMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingEnrollmentMappingAdjuster implements EnrollmentMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleEnrollmentMappingAdjuster implements EnrollmentMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: EnrollmentMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the enrollment mapping steps in order and keeps a trace of each. */
export class EnrollmentMappingEngine {
  steps: EnrollmentMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EnrollmentMapping): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: EnrollmentMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEnrollmentMappingEngine(): EnrollmentMappingEngine {
  return new EnrollmentMappingEngine(
    [
      new EnrollmentMappingWindowDaysOffsetAdjuster(0.3),
      new TieredEnrollmentMappingAdjuster([1173, 4601, 7879], [1.06, 1.16, 0.99]),
      new MinimumEnrollmentMappingAdjuster(37.6),
      new RoundingEnrollmentMappingAdjuster(1),
      new TitleEnrollmentMappingAdjuster(new Map<string, number>([["retail", 0.74]])),
    ],
    [],
    0.1,
    71473.6,
  );
}
