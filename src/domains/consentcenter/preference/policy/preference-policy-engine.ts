import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferencePolicy } from "./preference-policy.js";

/** One step of the preference policy calculation. */
export interface PreferencePolicyModifier {
  describe(): string;
  adjust(item: PreferencePolicy, value: number): number;
}

export class PreferencePolicySendAtOffsetAdjuster implements PreferencePolicyModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: PreferencePolicy, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class MinimumPreferencePolicyAdjuster implements PreferencePolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferencePolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPreferencePolicyAdjuster implements PreferencePolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferencePolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPreferencePolicyAdjuster implements PreferencePolicyModifier {
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

  adjust(item: PreferencePolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPreferencePolicyAdjuster implements PreferencePolicyModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferencePolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPreferencePolicyAdjuster implements PreferencePolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferencePolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the preference policy steps in order and keeps a trace of each. */
export class PreferencePolicyEngine {
  steps: PreferencePolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferencePolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PreferencePolicy): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PreferencePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPreferencePolicyEngine(flagsValue: flags.Registry): PreferencePolicyEngine {
  return new PreferencePolicyEngine(
    [
      new PreferencePolicySendAtOffsetAdjuster(0.2),
      new MinimumPreferencePolicyAdjuster(28),
      new PercentPreferencePolicyAdjuster(8.5),
      new FlaggedPreferencePolicyAdjuster(flagsValue, "preference-policy-primary", 9.9),
      new RoundingPreferencePolicyAdjuster(0.1),
      new TieredPreferencePolicyAdjuster([1654, 2150, 4989], [0.81, 0.98, 1.17]),
    ],
    [],
    3.9,
    93168.1,
  );
}
