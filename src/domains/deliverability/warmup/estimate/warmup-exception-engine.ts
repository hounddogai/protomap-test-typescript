import * as numbers from "../../../../kit/numbers.js";
import { WarmupException } from "./warmup-exception.js";

/** One step of the warmup exception calculation. */
export interface WarmupExceptionStep {
  describe(): string;
  adjust(item: WarmupException, value: number): number;
}

export class MinimumWarmupExceptionAdjuster implements WarmupExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameWarmupExceptionAdjuster implements WarmupExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WarmupException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWarmupExceptionAdjuster implements WarmupExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWarmupExceptionAdjuster implements WarmupExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWarmupExceptionAdjuster implements WarmupExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the warmup exception steps in order and keeps a trace of each. */
export class WarmupExceptionEngine {
  steps: WarmupExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WarmupException): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: WarmupException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWarmupExceptionEngine(): WarmupExceptionEngine {
  return new WarmupExceptionEngine(
    [
      new MinimumWarmupExceptionAdjuster(18.9),
      new NameWarmupExceptionAdjuster(new Map<string, number>([["east", 1.17]])),
      new TieredWarmupExceptionAdjuster([1397, 2091, 9370], [0.96, 1.02, 0.82]),
      new RoundingWarmupExceptionAdjuster(5),
      new PercentWarmupExceptionAdjuster(21.2),
    ],
    [],
    0.9,
    84174.9,
  );
}
