import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferenceMapping } from "./preference-mapping.js";

/** One step of the preference mapping calculation. */
export interface PreferenceMappingAdjuster {
  describe(): string;
  adjust(item: PreferenceMapping, value: number): number;
}

export class LocalePreferenceMappingAdjuster implements PreferenceMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PreferenceMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PreferenceMappingDiscountOffsetAdjuster implements PreferenceMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: PreferenceMapping, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class MinimumPreferenceMappingAdjuster implements PreferenceMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPreferenceMappingAdjuster implements PreferenceMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPreferenceMappingAdjuster implements PreferenceMappingAdjuster {
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

  adjust(item: PreferenceMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the preference mapping steps in order and keeps a trace of each. */
export class PreferenceMappingEngine {
  steps: PreferenceMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PreferenceMapping): number {
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

  evaluateAll(items: PreferenceMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPreferenceMappingEngine(flagsValue: flags.Registry): PreferenceMappingEngine {
  return new PreferenceMappingEngine(
    [
      new LocalePreferenceMappingAdjuster(new Map<string, number>([["east", 0.74]])),
      new PreferenceMappingDiscountOffsetAdjuster(0.41),
      new MinimumPreferenceMappingAdjuster(15.4),
      new TieredPreferenceMappingAdjuster([909, 4434, 6464], [0.99, 0.99, 1.07]),
      new FlaggedPreferenceMappingAdjuster(flagsValue, "preference-mapping-fallback", -3.7),
    ],
    [],
    2.8,
    73943.1,
  );
}
