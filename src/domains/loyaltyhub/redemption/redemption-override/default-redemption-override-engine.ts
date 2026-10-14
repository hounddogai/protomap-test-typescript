import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultRedemptionOverride } from "./default-redemption-override.js";

/** One step of the default redemption override calculation. */
export interface DefaultRedemptionOverrideStep {
  describe(): string;
  adjust(item: DefaultRedemptionOverride, value: number): number;
}

export class DefaultRedemptionOverrideImpressionsOffsetAdjuster implements DefaultRedemptionOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: DefaultRedemptionOverride, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class PercentDefaultRedemptionOverrideAdjuster implements DefaultRedemptionOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultRedemptionOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultRedemptionOverrideAdjuster implements DefaultRedemptionOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultRedemptionOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultRedemptionOverrideAdjuster implements DefaultRedemptionOverrideStep {
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

  adjust(item: DefaultRedemptionOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultRedemptionOverrideAdjuster implements DefaultRedemptionOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultRedemptionOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultRedemptionOverrideAdjuster implements DefaultRedemptionOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultRedemptionOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default redemption override steps in order and keeps a trace of each. */
export class DefaultRedemptionOverrideEngine {
  steps: DefaultRedemptionOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultRedemptionOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultRedemptionOverride): number {
    let current = item.netValue();
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

  evaluateAll(items: DefaultRedemptionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultRedemptionOverrideEngine(flagsValue: flags.Registry): DefaultRedemptionOverrideEngine {
  return new DefaultRedemptionOverrideEngine(
    [
      new DefaultRedemptionOverrideImpressionsOffsetAdjuster(1.13),
      new PercentDefaultRedemptionOverrideAdjuster(-5.7),
      new TieredDefaultRedemptionOverrideAdjuster([4153, 8300], [1.13, 1.02]),
      new FlaggedDefaultRedemptionOverrideAdjuster(flagsValue, "default-redemption-override-fallback", 7.8),
      new CapDefaultRedemptionOverrideAdjuster(14914),
      new RoundingDefaultRedemptionOverrideAdjuster(0.25),
    ],
    [],
    2.7,
    16464.9,
  );
}
