import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupOverride } from "./warmup-override.js";

/** One step of the warmup override calculation. */
export interface WarmupOverrideStep {
  describe(): string;
  adjust(item: WarmupOverride, value: number): number;
}

export class CapWarmupOverrideAdjuster implements WarmupOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWarmupOverrideAdjuster implements WarmupOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWarmupOverrideAdjuster implements WarmupOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWarmupOverrideAdjuster implements WarmupOverrideStep {
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

  adjust(item: WarmupOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWarmupOverrideAdjuster implements WarmupOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleWarmupOverrideAdjuster implements WarmupOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WarmupOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the warmup override steps in order and keeps a trace of each. */
export class WarmupOverrideEngine {
  steps: WarmupOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WarmupOverride): number {
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

  evaluateAll(items: WarmupOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWarmupOverrideEngine(flagsValue: flags.Registry): WarmupOverrideEngine {
  return new WarmupOverrideEngine(
    [
      new CapWarmupOverrideAdjuster(34958),
      new RoundingWarmupOverrideAdjuster(5),
      new TieredWarmupOverrideAdjuster([1473, 3121, 8247], [0.8, 1.07, 0.84]),
      new FlaggedWarmupOverrideAdjuster(flagsValue, "warmup-override-rolling", 0.9),
      new MinimumWarmupOverrideAdjuster(31.1),
      new LocaleWarmupOverrideAdjuster(
        new Map<string, number>([["online", 0.84], ["north", 1.03], ["east", 1.29]]),
      ),
    ],
    [],
    4.3,
    81263.2,
  );
}
