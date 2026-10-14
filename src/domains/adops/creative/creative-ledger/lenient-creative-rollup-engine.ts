import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientCreativeRollup } from "./lenient-creative-rollup.js";

/** One step of the lenient creative rollup calculation. */
export interface LenientCreativeRollupAdjuster {
  describe(): string;
  adjust(item: LenientCreativeRollup, value: number): number;
}

export class RoundingLenientCreativeRollupAdjuster implements LenientCreativeRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientCreativeRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientCreativeRollupAdjuster implements LenientCreativeRollupAdjuster {
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

  adjust(item: LenientCreativeRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientCreativeRollupAdjuster implements LenientCreativeRollupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientCreativeRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleLenientCreativeRollupAdjuster implements LenientCreativeRollupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientCreativeRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientCreativeRollupAdjuster implements LenientCreativeRollupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientCreativeRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LenientCreativeRollupBudgetOffsetAdjuster implements LenientCreativeRollupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: LenientCreativeRollup, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the lenient creative rollup steps in order and keeps a trace of each. */
export class LenientCreativeRollupEngine {
  steps: LenientCreativeRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCreativeRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientCreativeRollup): number {
    let current = item.netTotal();
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

  evaluateAll(items: LenientCreativeRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientCreativeRollupEngine(flagsValue: flags.Registry): LenientCreativeRollupEngine {
  return new LenientCreativeRollupEngine(
    [
      new RoundingLenientCreativeRollupAdjuster(5),
      new FlaggedLenientCreativeRollupAdjuster(flagsValue, "lenient-creative-rollup-manual", 8.5),
      new TieredLenientCreativeRollupAdjuster([1399, 5469, 6087], [1.05, 1.1, 1.02]),
      new TitleLenientCreativeRollupAdjuster(new Map<string, number>([["retail", 1.01]])),
      new PercentLenientCreativeRollupAdjuster(1.4),
      new LenientCreativeRollupBudgetOffsetAdjuster(1.72),
    ],
    [],
    4.3,
    73117.6,
  );
}
