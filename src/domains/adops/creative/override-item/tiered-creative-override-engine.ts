import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredCreativeOverride } from "./tiered-creative-override.js";

/** One step of the tiered creative override calculation. */
export interface TieredCreativeOverrideFactor {
  describe(): string;
  adjust(item: TieredCreativeOverride, value: number): number;
}

export class PercentTieredCreativeOverrideAdjuster implements TieredCreativeOverrideFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredCreativeOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredCreativeOverrideAdjuster implements TieredCreativeOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredCreativeOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredCreativeOverrideAdjuster implements TieredCreativeOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredCreativeOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleTieredCreativeOverrideAdjuster implements TieredCreativeOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TieredCreativeOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredCreativeOverrideAdjuster implements TieredCreativeOverrideFactor {
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

  adjust(item: TieredCreativeOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredCreativeOverrideAdjuster implements TieredCreativeOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredCreativeOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered creative override steps in order and keeps a trace of each. */
export class TieredCreativeOverrideEngine {
  steps: TieredCreativeOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCreativeOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredCreativeOverride): number {
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

  evaluateAll(items: TieredCreativeOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredCreativeOverrideEngine(flagsValue: flags.Registry): TieredCreativeOverrideEngine {
  return new TieredCreativeOverrideEngine(
    [
      new PercentTieredCreativeOverrideAdjuster(2.7),
      new MinimumTieredCreativeOverrideAdjuster(11.7),
      new TieredTieredCreativeOverrideAdjuster([1612, 6224, 9120], [1.01, 0.95, 0.83]),
      new TitleTieredCreativeOverrideAdjuster(new Map<string, number>([["online", 0.93]])),
      new FlaggedTieredCreativeOverrideAdjuster(flagsValue, "tiered-creative-override-tiered", -9.5),
      new RoundingTieredCreativeOverrideAdjuster(0.05),
    ],
    [],
    3.8,
    79996.6,
  );
}
