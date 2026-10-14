import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackStepBaseline } from "./fallback-step-baseline.js";

/** One step of the fallback step baseline calculation. */
export interface FallbackStepBaselineAdjuster {
  describe(): string;
  adjust(item: FallbackStepBaseline, value: number): number;
}

export class FallbackStepBaselineOpenRateOffsetAdjuster implements FallbackStepBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: FallbackStepBaseline, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class UnitFallbackStepBaselineAdjuster implements FallbackStepBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: FallbackStepBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackStepBaselineAdjuster implements FallbackStepBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackStepBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackStepBaselineAdjuster implements FallbackStepBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackStepBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackStepBaselineAdjuster implements FallbackStepBaselineAdjuster {
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

  adjust(item: FallbackStepBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackStepBaselineAdjuster implements FallbackStepBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackStepBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback step baseline steps in order and keeps a trace of each. */
export class FallbackStepBaselineEngine {
  steps: FallbackStepBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackStepBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackStepBaseline): number {
    let current = item.netVolume();
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

  evaluateAll(items: FallbackStepBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackStepBaselineEngine(flagsValue: flags.Registry): FallbackStepBaselineEngine {
  return new FallbackStepBaselineEngine(
    [
      new FallbackStepBaselineOpenRateOffsetAdjuster(0.38),
      new UnitFallbackStepBaselineAdjuster(new Map<string, number>([["south", 0.76], ["west", 0.77]])),
      new MinimumFallbackStepBaselineAdjuster(18.3),
      new TieredFallbackStepBaselineAdjuster([2878, 4868, 5711, 9950], [0.81, 1.07, 1.15, 1.09]),
      new FlaggedFallbackStepBaselineAdjuster(flagsValue, "fallback-step-baseline-batched", -7.8),
      new RoundingFallbackStepBaselineAdjuster(0.05),
    ],
    [],
    2,
    90143.7,
  );
}
