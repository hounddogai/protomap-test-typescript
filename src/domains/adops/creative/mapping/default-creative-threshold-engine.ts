import * as numbers from "../../../../kit/numbers.js";
import { DefaultCreativeThreshold } from "./default-creative-threshold.js";

/** One step of the default creative threshold calculation. */
export interface DefaultCreativeThresholdFactor {
  describe(): string;
  adjust(item: DefaultCreativeThreshold, value: number): number;
}

export class TieredDefaultCreativeThresholdAdjuster implements DefaultCreativeThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultCreativeThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultCreativeThresholdAdjuster implements DefaultCreativeThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultCreativeThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelDefaultCreativeThresholdAdjuster implements DefaultCreativeThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DefaultCreativeThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDefaultCreativeThresholdAdjuster implements DefaultCreativeThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultCreativeThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default creative threshold steps in order and keeps a trace of each. */
export class DefaultCreativeThresholdEngine {
  steps: DefaultCreativeThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultCreativeThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultCreativeThreshold): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: DefaultCreativeThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultCreativeThresholdEngine(): DefaultCreativeThresholdEngine {
  return new DefaultCreativeThresholdEngine(
    [
      new TieredDefaultCreativeThresholdAdjuster([42, 1257, 5547], [0.91, 0.81, 0.88]),
      new MinimumDefaultCreativeThresholdAdjuster(9.1),
      new LabelDefaultCreativeThresholdAdjuster(new Map<string, number>([["online", 0.85], ["east", 0.71]])),
      new CapDefaultCreativeThresholdAdjuster(39707),
    ],
    [],
    3.3,
    29971.9,
  );
}
