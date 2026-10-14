import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferenceOverride } from "./preference-override.js";

/** One step of the preference override calculation. */
export interface PreferenceOverrideStep {
  describe(): string;
  adjust(item: PreferenceOverride, value: number): number;
}

export class TieredPreferenceOverrideAdjuster implements PreferenceOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPreferenceOverrideAdjuster implements PreferenceOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPreferenceOverrideAdjuster implements PreferenceOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPreferenceOverrideAdjuster implements PreferenceOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PreferenceOverrideSendAtOffsetAdjuster implements PreferenceOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: PreferenceOverride, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class FlaggedPreferenceOverrideAdjuster implements PreferenceOverrideStep {
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

  adjust(item: PreferenceOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the preference override steps in order and keeps a trace of each. */
export class PreferenceOverrideEngine {
  steps: PreferenceOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PreferenceOverride): number {
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

  evaluateAll(items: PreferenceOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPreferenceOverrideEngine(flagsValue: flags.Registry): PreferenceOverrideEngine {
  return new PreferenceOverrideEngine(
    [
      new TieredPreferenceOverrideAdjuster([1129, 2336], [0.82, 1.12]),
      new MinimumPreferenceOverrideAdjuster(4.6),
      new PercentPreferenceOverrideAdjuster(-20.1),
      new RoundingPreferenceOverrideAdjuster(1),
      new PreferenceOverrideSendAtOffsetAdjuster(1.35),
      new FlaggedPreferenceOverrideAdjuster(flagsValue, "preference-override-manual", 9.7),
    ],
    [],
    2.5,
    32297,
  );
}
