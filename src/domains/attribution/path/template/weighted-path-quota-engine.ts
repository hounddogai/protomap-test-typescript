import * as numbers from "../../../../kit/numbers.js";
import { WeightedPathQuota } from "./weighted-path-quota.js";

/** One step of the weighted path quota calculation. */
export interface WeightedPathQuotaModifier {
  describe(): string;
  adjust(item: WeightedPathQuota, value: number): number;
}

export class LocaleWeightedPathQuotaAdjuster implements WeightedPathQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WeightedPathQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWeightedPathQuotaAdjuster implements WeightedPathQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedPathQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedPathQuotaAdjuster implements WeightedPathQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedPathQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWeightedPathQuotaAdjuster implements WeightedPathQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPathQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedPathQuotaSequenceOffsetAdjuster implements WeightedPathQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: WeightedPathQuota, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the weighted path quota steps in order and keeps a trace of each. */
export class WeightedPathQuotaEngine {
  steps: WeightedPathQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPathQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedPathQuota): number {
    let current = item.netValue();
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

  evaluateAll(items: WeightedPathQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedPathQuotaEngine(): WeightedPathQuotaEngine {
  return new WeightedPathQuotaEngine(
    [
      new LocaleWeightedPathQuotaAdjuster(new Map<string, number>([["south", 1.17]])),
      new PercentWeightedPathQuotaAdjuster(-0.9),
      new CapWeightedPathQuotaAdjuster(16413),
      new MinimumWeightedPathQuotaAdjuster(25.8),
      new WeightedPathQuotaSequenceOffsetAdjuster(1.91),
    ],
    [],
    1.3,
    10158.3,
  );
}
