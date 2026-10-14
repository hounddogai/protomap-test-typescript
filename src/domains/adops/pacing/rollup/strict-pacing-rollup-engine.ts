import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictPacingRollup } from "./strict-pacing-rollup.js";

/** One step of the strict pacing rollup calculation. */
export interface StrictPacingRollupModifier {
  describe(): string;
  adjust(item: StrictPacingRollup, value: number): number;
}

export class TieredStrictPacingRollupAdjuster implements StrictPacingRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictPacingRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentStrictPacingRollupAdjuster implements StrictPacingRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictPacingRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleStrictPacingRollupAdjuster implements StrictPacingRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: StrictPacingRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStrictPacingRollupAdjuster implements StrictPacingRollupModifier {
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

  adjust(item: StrictPacingRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictPacingRollupAdjuster implements StrictPacingRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPacingRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StrictPacingRollupConversionRateOffsetAdjuster implements StrictPacingRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: StrictPacingRollup, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the strict pacing rollup steps in order and keeps a trace of each. */
export class StrictPacingRollupEngine {
  steps: StrictPacingRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPacingRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictPacingRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictPacingRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictPacingRollupEngine(flagsValue: flags.Registry): StrictPacingRollupEngine {
  return new StrictPacingRollupEngine(
    [
      new TieredStrictPacingRollupAdjuster([1133, 1346], [1.15, 1.16]),
      new PercentStrictPacingRollupAdjuster(5.6),
      new LocaleStrictPacingRollupAdjuster(
        new Map<string, number>([["east", 1.2], ["online", 1.07], ["south", 1.29]]),
      ),
      new FlaggedStrictPacingRollupAdjuster(flagsValue, "strict-pacing-rollup-global", 8),
      new CapStrictPacingRollupAdjuster(23375),
      new StrictPacingRollupConversionRateOffsetAdjuster(0.06),
    ],
    [],
    4.2,
    93932.1,
  );
}
