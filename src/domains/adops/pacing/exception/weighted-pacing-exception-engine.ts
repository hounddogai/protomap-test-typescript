import * as flags from "../../../../kit/flags.js";
import { WeightedPacingException } from "./weighted-pacing-exception.js";

/** One step of the weighted pacing exception calculation. */
export interface WeightedPacingExceptionStep {
  describe(): string;
  adjust(item: WeightedPacingException, value: number): number;
}

export class TieredWeightedPacingExceptionAdjuster implements WeightedPacingExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedPacingException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameWeightedPacingExceptionAdjuster implements WeightedPacingExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WeightedPacingException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedPacingExceptionAdjuster implements WeightedPacingExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedPacingException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWeightedPacingExceptionAdjuster implements WeightedPacingExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPacingException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWeightedPacingExceptionAdjuster implements WeightedPacingExceptionStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WeightedPacingException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted pacing exception steps in order and keeps a trace of each. */
export class WeightedPacingExceptionEngine {
  steps: WeightedPacingExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPacingExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedPacingException): number {
    let current = item.weightedValue();
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

  evaluateAll(items: WeightedPacingException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedPacingExceptionEngine(flagsValue: flags.Registry): WeightedPacingExceptionEngine {
  return new WeightedPacingExceptionEngine(
    [
      new TieredWeightedPacingExceptionAdjuster([74, 2910, 3436, 6756], [0.87, 0.94, 1.06, 1.05]),
      new NameWeightedPacingExceptionAdjuster(new Map<string, number>([["north", 1.27], ["online", 0.86]])),
      new CapWeightedPacingExceptionAdjuster(3873),
      new MinimumWeightedPacingExceptionAdjuster(1),
      new FlaggedWeightedPacingExceptionAdjuster(flagsValue, "weighted-pacing-exception-capped", -0.7),
    ],
    [],
    2.8,
    34525.8,
  );
}
