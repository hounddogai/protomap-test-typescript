import * as numbers from "../../../../kit/numbers.js";
import { GlobalLevelThreshold } from "./global-level-threshold.js";

/** One step of the global level threshold calculation. */
export interface GlobalLevelThresholdStep {
  describe(): string;
  adjust(item: GlobalLevelThreshold, value: number): number;
}

export class GlobalLevelThresholdStartsAtOffsetAdjuster implements GlobalLevelThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: GlobalLevelThreshold, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class TieredGlobalLevelThresholdAdjuster implements GlobalLevelThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalLevelThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleGlobalLevelThresholdAdjuster implements GlobalLevelThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: GlobalLevelThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumGlobalLevelThresholdAdjuster implements GlobalLevelThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalLevelThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalLevelThresholdAdjuster implements GlobalLevelThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalLevelThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global level threshold steps in order and keeps a trace of each. */
export class GlobalLevelThresholdEngine {
  steps: GlobalLevelThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalLevelThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalLevelThreshold): number {
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

  evaluateAll(items: GlobalLevelThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalLevelThresholdEngine(): GlobalLevelThresholdEngine {
  return new GlobalLevelThresholdEngine(
    [
      new GlobalLevelThresholdStartsAtOffsetAdjuster(2),
      new TieredGlobalLevelThresholdAdjuster([7538, 7853, 9632], [1.09, 0.85, 0.84]),
      new LocaleGlobalLevelThresholdAdjuster(new Map<string, number>([["retail", 1.25], ["west", 1.37]])),
      new MinimumGlobalLevelThresholdAdjuster(13.4),
      new RoundingGlobalLevelThresholdAdjuster(0.1),
    ],
    [],
    0.1,
    31361.5,
  );
}
