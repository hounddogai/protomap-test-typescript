import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionOverride } from "./conversion-override.js";

/** One step of the conversion override calculation. */
export interface ConversionOverrideModifier {
  describe(): string;
  adjust(item: ConversionOverride, value: number): number;
}

export class CapConversionOverrideAdjuster implements ConversionOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionConversionOverrideAdjuster implements ConversionOverrideModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ConversionOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedConversionOverrideAdjuster implements ConversionOverrideModifier {
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

  adjust(item: ConversionOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredConversionOverrideAdjuster implements ConversionOverrideModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the conversion override steps in order and keeps a trace of each. */
export class ConversionOverrideEngine {
  steps: ConversionOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ConversionOverride): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ConversionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultConversionOverrideEngine(flagsValue: flags.Registry): ConversionOverrideEngine {
  return new ConversionOverrideEngine(
    [
      new CapConversionOverrideAdjuster(23425),
      new RegionConversionOverrideAdjuster(new Map<string, number>([["north", 1]])),
      new FlaggedConversionOverrideAdjuster(flagsValue, "conversion-override-fallback", 4.4),
      new TieredConversionOverrideAdjuster([5077, 8633], [0.99, 1.03]),
    ],
    [],
    0.1,
    42868.1,
  );
}
