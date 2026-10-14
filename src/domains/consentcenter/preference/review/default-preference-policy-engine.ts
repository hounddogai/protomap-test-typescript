import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPreferencePolicy } from "./default-preference-policy.js";

/** One step of the default preference policy calculation. */
export interface DefaultPreferencePolicyFactor {
  describe(): string;
  adjust(item: DefaultPreferencePolicy, value: number): number;
}

export class RoundingDefaultPreferencePolicyAdjuster implements DefaultPreferencePolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPreferencePolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultPreferencePolicyAdjuster implements DefaultPreferencePolicyFactor {
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

  adjust(item: DefaultPreferencePolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultPreferencePolicyAdjuster implements DefaultPreferencePolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPreferencePolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDefaultPreferencePolicyAdjuster implements DefaultPreferencePolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPreferencePolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DefaultPreferencePolicyCapacityOffsetAdjuster implements DefaultPreferencePolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: DefaultPreferencePolicy, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class MinimumDefaultPreferencePolicyAdjuster implements DefaultPreferencePolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultPreferencePolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default preference policy steps in order and keeps a trace of each. */
export class DefaultPreferencePolicyEngine {
  steps: DefaultPreferencePolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPreferencePolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultPreferencePolicy): number {
    let current = item.netExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: DefaultPreferencePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultPreferencePolicyEngine(flagsValue: flags.Registry): DefaultPreferencePolicyEngine {
  return new DefaultPreferencePolicyEngine(
    [
      new RoundingDefaultPreferencePolicyAdjuster(0.05),
      new FlaggedDefaultPreferencePolicyAdjuster(flagsValue, "default-preference-policy-seasonal", -1.1),
      new TieredDefaultPreferencePolicyAdjuster([921, 4563, 6302], [1.16, 1.06, 1.06]),
      new CapDefaultPreferencePolicyAdjuster(41430),
      new DefaultPreferencePolicyCapacityOffsetAdjuster(0.51),
      new MinimumDefaultPreferencePolicyAdjuster(9),
    ],
    [],
    1,
    7786.5,
  );
}
