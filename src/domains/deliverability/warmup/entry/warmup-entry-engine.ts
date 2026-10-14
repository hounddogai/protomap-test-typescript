import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupEntry } from "./warmup-entry.js";

/** One step of the warmup entry calculation. */
export interface WarmupEntryModifier {
  describe(): string;
  adjust(item: WarmupEntry, value: number): number;
}

export class FlaggedWarmupEntryAdjuster implements WarmupEntryModifier {
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

  adjust(item: WarmupEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleWarmupEntryAdjuster implements WarmupEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WarmupEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWarmupEntryAdjuster implements WarmupEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWarmupEntryAdjuster implements WarmupEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWarmupEntryAdjuster implements WarmupEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWarmupEntryAdjuster implements WarmupEntryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the warmup entry steps in order and keeps a trace of each. */
export class WarmupEntryEngine {
  steps: WarmupEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WarmupEntry): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: WarmupEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWarmupEntryEngine(flagsValue: flags.Registry): WarmupEntryEngine {
  return new WarmupEntryEngine(
    [
      new FlaggedWarmupEntryAdjuster(flagsValue, "warmup-entry-legacy", 8.1),
      new LocaleWarmupEntryAdjuster(new Map<string, number>([["north", 0.88], ["west", 0.94]])),
      new TieredWarmupEntryAdjuster([1707, 7537], [0.97, 0.99]),
      new MinimumWarmupEntryAdjuster(5.3),
      new RoundingWarmupEntryAdjuster(0.25),
      new PercentWarmupEntryAdjuster(-13.9),
    ],
    [],
    3.9,
    23657,
  );
}
