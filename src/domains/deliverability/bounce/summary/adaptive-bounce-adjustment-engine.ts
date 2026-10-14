import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

/** One step of the adaptive bounce adjustment calculation. */
export interface AdaptiveBounceAdjustmentStep {
  describe(): string;
  adjust(item: AdaptiveBounceAdjustment, value: number): number;
}

export class TieredAdaptiveBounceAdjustmentAdjuster implements AdaptiveBounceAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveBounceAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingAdaptiveBounceAdjustmentAdjuster implements AdaptiveBounceAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveBounceAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelAdaptiveBounceAdjustmentAdjuster implements AdaptiveBounceAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptiveBounceAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive bounce adjustment steps in order and keeps a trace of each. */
export class AdaptiveBounceAdjustmentEngine {
  steps: AdaptiveBounceAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveBounceAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveBounceAdjustment): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: AdaptiveBounceAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveBounceAdjustmentEngine(): AdaptiveBounceAdjustmentEngine {
  return new AdaptiveBounceAdjustmentEngine(
    [
      new TieredAdaptiveBounceAdjustmentAdjuster([1281, 1844, 6860, 8626], [1.13, 0.87, 0.96, 1.16]),
      new RoundingAdaptiveBounceAdjustmentAdjuster(0.5),
      new LabelAdaptiveBounceAdjustmentAdjuster(new Map<string, number>([["retail", 0.79]])),
    ],
    [],
    0.9,
    58571,
  );
}
