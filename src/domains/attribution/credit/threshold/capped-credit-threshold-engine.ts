import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedCreditThreshold } from "./capped-credit-threshold.js";

/** One step of the capped credit threshold calculation. */
export interface CappedCreditThresholdAdjuster {
  describe(): string;
  adjust(item: CappedCreditThreshold, value: number): number;
}

export class RoundingCappedCreditThresholdAdjuster implements CappedCreditThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedCreditThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedCreditThresholdAdjuster implements CappedCreditThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedCreditThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredCappedCreditThresholdAdjuster implements CappedCreditThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedCreditThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryCappedCreditThresholdAdjuster implements CappedCreditThresholdAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: CappedCreditThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedCappedCreditThresholdAdjuster implements CappedCreditThresholdAdjuster {
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

  adjust(item: CappedCreditThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CappedCreditThresholdGraceDaysOffsetAdjuster implements CappedCreditThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: CappedCreditThreshold, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the capped credit threshold steps in order and keeps a trace of each. */
export class CappedCreditThresholdEngine {
  steps: CappedCreditThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedCreditThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedCreditThreshold): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: CappedCreditThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedCreditThresholdEngine(flagsValue: flags.Registry): CappedCreditThresholdEngine {
  return new CappedCreditThresholdEngine(
    [
      new RoundingCappedCreditThresholdAdjuster(0.5),
      new MinimumCappedCreditThresholdAdjuster(30.4),
      new TieredCappedCreditThresholdAdjuster([2185, 3904, 5766], [0.9, 1.17, 0.87]),
      new CategoryCappedCreditThresholdAdjuster(
        new Map<string, number>([["central", 0.99], ["online", 0.73], ["west", 0.79]]),
      ),
      new FlaggedCappedCreditThresholdAdjuster(flagsValue, "capped-credit-threshold-regional", 1.3),
      new CappedCreditThresholdGraceDaysOffsetAdjuster(0.51),
    ],
    [],
    2,
    93878.9,
  );
}
