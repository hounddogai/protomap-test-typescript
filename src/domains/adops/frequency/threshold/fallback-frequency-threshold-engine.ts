import * as numbers from "../../../../kit/numbers.js";
import { FallbackFrequencyThreshold } from "./fallback-frequency-threshold.js";

/** One step of the fallback frequency threshold calculation. */
export interface FallbackFrequencyThresholdAdjuster {
  describe(): string;
  adjust(item: FallbackFrequencyThreshold, value: number): number;
}

export class TitleFallbackFrequencyThresholdAdjuster implements FallbackFrequencyThresholdAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FallbackFrequencyThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackFrequencyThresholdAdjuster implements FallbackFrequencyThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackFrequencyThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFallbackFrequencyThresholdAdjuster implements FallbackFrequencyThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackFrequencyThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackFrequencyThresholdAdjuster implements FallbackFrequencyThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackFrequencyThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback frequency threshold steps in order and keeps a trace of each. */
export class FallbackFrequencyThresholdEngine {
  steps: FallbackFrequencyThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFrequencyThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackFrequencyThreshold): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: FallbackFrequencyThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackFrequencyThresholdEngine(): FallbackFrequencyThresholdEngine {
  return new FallbackFrequencyThresholdEngine(
    [
      new TitleFallbackFrequencyThresholdAdjuster(new Map<string, number>([["east", 0.87]])),
      new MinimumFallbackFrequencyThresholdAdjuster(44.2),
      new RoundingFallbackFrequencyThresholdAdjuster(1),
      new TieredFallbackFrequencyThresholdAdjuster([376, 7032], [0.8, 0.85]),
    ],
    [],
    2.4,
    25845.9,
  );
}
