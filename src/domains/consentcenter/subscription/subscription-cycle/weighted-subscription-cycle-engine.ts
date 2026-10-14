import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedSubscriptionCycle } from "./weighted-subscription-cycle.js";

/** One step of the weighted subscription cycle calculation. */
export interface WeightedSubscriptionCycleFactor {
  describe(): string;
  adjust(item: WeightedSubscriptionCycle, value: number): number;
}

export class FlaggedWeightedSubscriptionCycleAdjuster implements WeightedSubscriptionCycleFactor {
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

  adjust(item: WeightedSubscriptionCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedSubscriptionCycleAdjuster implements WeightedSubscriptionCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedSubscriptionCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceWeightedSubscriptionCycleAdjuster implements WeightedSubscriptionCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WeightedSubscriptionCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWeightedSubscriptionCycleAdjuster implements WeightedSubscriptionCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedSubscriptionCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedSubscriptionCycleLimitOffsetAdjuster implements WeightedSubscriptionCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: WeightedSubscriptionCycle, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class TieredWeightedSubscriptionCycleAdjuster implements WeightedSubscriptionCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedSubscriptionCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted subscription cycle steps in order and keeps a trace of each. */
export class WeightedSubscriptionCycleEngine {
  steps: WeightedSubscriptionCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedSubscriptionCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedSubscriptionCycle): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: WeightedSubscriptionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedSubscriptionCycleEngine(flagsValue: flags.Registry): WeightedSubscriptionCycleEngine {
  return new WeightedSubscriptionCycleEngine(
    [
      new FlaggedWeightedSubscriptionCycleAdjuster(flagsValue, "weighted-subscription-cycle-rolling", 7),
      new MinimumWeightedSubscriptionCycleAdjuster(32.3),
      new SourceWeightedSubscriptionCycleAdjuster(
        new Map<string, number>([["central", 0.83], ["retail", 1.18], ["north", 0.94]]),
      ),
      new RoundingWeightedSubscriptionCycleAdjuster(0.05),
      new WeightedSubscriptionCycleLimitOffsetAdjuster(1.85),
      new TieredWeightedSubscriptionCycleAdjuster([157, 9317], [0.86, 0.87]),
    ],
    [],
    4.6,
    35362.3,
  );
}
