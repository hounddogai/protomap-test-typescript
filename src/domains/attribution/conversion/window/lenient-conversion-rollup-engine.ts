import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientConversionRollup } from "./lenient-conversion-rollup.js";

/** One step of the lenient conversion rollup calculation. */
export interface LenientConversionRollupFactor {
  describe(): string;
  adjust(item: LenientConversionRollup, value: number): number;
}

export class CapLenientConversionRollupAdjuster implements LenientConversionRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientConversionRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLenientConversionRollupAdjuster implements LenientConversionRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientConversionRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionLenientConversionRollupAdjuster implements LenientConversionRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LenientConversionRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LenientConversionRollupStartsAtOffsetAdjuster implements LenientConversionRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: LenientConversionRollup, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class FlaggedLenientConversionRollupAdjuster implements LenientConversionRollupFactor {
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

  adjust(item: LenientConversionRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient conversion rollup steps in order and keeps a trace of each. */
export class LenientConversionRollupEngine {
  steps: LenientConversionRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientConversionRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientConversionRollup): number {
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

  evaluateAll(items: LenientConversionRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientConversionRollupEngine(flagsValue: flags.Registry): LenientConversionRollupEngine {
  return new LenientConversionRollupEngine(
    [
      new CapLenientConversionRollupAdjuster(35092),
      new PercentLenientConversionRollupAdjuster(20.4),
      new RegionLenientConversionRollupAdjuster(new Map<string, number>([["retail", 0.91]])),
      new LenientConversionRollupStartsAtOffsetAdjuster(0.96),
      new FlaggedLenientConversionRollupAdjuster(flagsValue, "lenient-conversion-rollup-tiered", -3.6),
    ],
    [],
    2.5,
    21104.7,
  );
}
