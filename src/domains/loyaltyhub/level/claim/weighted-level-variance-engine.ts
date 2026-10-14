import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedLevelVariance } from "./weighted-level-variance.js";

/** One step of the weighted level variance calculation. */
export interface WeightedLevelVarianceFactor {
  describe(): string;
  adjust(item: WeightedLevelVariance, value: number): number;
}

export class RoundingWeightedLevelVarianceAdjuster implements WeightedLevelVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedLevelVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelWeightedLevelVarianceAdjuster implements WeightedLevelVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedLevelVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedLevelVarianceAdjuster implements WeightedLevelVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedLevelVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWeightedLevelVarianceAdjuster implements WeightedLevelVarianceFactor {
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

  adjust(item: WeightedLevelVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedLevelVarianceBatchSizeOffsetAdjuster implements WeightedLevelVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: WeightedLevelVariance, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the weighted level variance steps in order and keeps a trace of each. */
export class WeightedLevelVarianceEngine {
  steps: WeightedLevelVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedLevelVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedLevelVariance): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedLevelVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedLevelVarianceEngine(flagsValue: flags.Registry): WeightedLevelVarianceEngine {
  return new WeightedLevelVarianceEngine(
    [
      new RoundingWeightedLevelVarianceAdjuster(0.05),
      new LabelWeightedLevelVarianceAdjuster(new Map<string, number>([["central", 1.01], ["east", 0.88]])),
      new MinimumWeightedLevelVarianceAdjuster(17.6),
      new FlaggedWeightedLevelVarianceAdjuster(flagsValue, "weighted-level-variance-pending", -7.5),
      new WeightedLevelVarianceBatchSizeOffsetAdjuster(1.87),
    ],
    [],
    2.4,
    41935.1,
  );
}
