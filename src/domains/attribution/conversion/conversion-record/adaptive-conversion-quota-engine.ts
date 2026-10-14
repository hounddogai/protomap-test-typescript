import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveConversionQuota } from "./adaptive-conversion-quota.js";

/** One step of the adaptive conversion quota calculation. */
export interface AdaptiveConversionQuotaModifier {
  describe(): string;
  adjust(item: AdaptiveConversionQuota, value: number): number;
}

export class TieredAdaptiveConversionQuotaAdjuster implements AdaptiveConversionQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveConversionQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveConversionQuotaAdjuster implements AdaptiveConversionQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveConversionQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingAdaptiveConversionQuotaAdjuster implements AdaptiveConversionQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveConversionQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive conversion quota steps in order and keeps a trace of each. */
export class AdaptiveConversionQuotaEngine {
  steps: AdaptiveConversionQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveConversionQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveConversionQuota): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: AdaptiveConversionQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveConversionQuotaEngine(): AdaptiveConversionQuotaEngine {
  return new AdaptiveConversionQuotaEngine(
    [
      new TieredAdaptiveConversionQuotaAdjuster([1276, 3804, 5353, 5666], [1, 1.07, 1.15, 1.1]),
      new CapAdaptiveConversionQuotaAdjuster(44463),
      new RoundingAdaptiveConversionQuotaAdjuster(1),
    ],
    [],
    5,
    95582.4,
  );
}
