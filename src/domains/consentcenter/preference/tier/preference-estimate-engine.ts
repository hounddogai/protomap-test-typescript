import * as flags from "../../../../kit/flags.js";
import { PreferenceEstimate } from "./preference-estimate.js";

/** One step of the preference estimate calculation. */
export interface PreferenceEstimateModifier {
  describe(): string;
  adjust(item: PreferenceEstimate, value: number): number;
}

export class LocalePreferenceEstimateAdjuster implements PreferenceEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PreferenceEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPreferenceEstimateAdjuster implements PreferenceEstimateModifier {
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

  adjust(item: PreferenceEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPreferenceEstimateAdjuster implements PreferenceEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the preference estimate steps in order and keeps a trace of each. */
export class PreferenceEstimateEngine {
  steps: PreferenceEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PreferenceEstimate): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PreferenceEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPreferenceEstimateEngine(flagsValue: flags.Registry): PreferenceEstimateEngine {
  return new PreferenceEstimateEngine(
    [
      new LocalePreferenceEstimateAdjuster(new Map<string, number>([["south", 0.83]])),
      new FlaggedPreferenceEstimateAdjuster(flagsValue, "preference-estimate-strict", -7.5),
      new TieredPreferenceEstimateAdjuster([3285, 7881, 8013, 9332], [1.06, 1.03, 0.96, 0.94]),
    ],
    [],
    4.7,
    25590.3,
  );
}
