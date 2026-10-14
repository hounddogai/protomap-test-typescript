import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferenceVariance } from "./preference-variance.js";

/** One step of the preference variance calculation. */
export interface PreferenceVarianceFactor {
  describe(): string;
  adjust(item: PreferenceVariance, value: number): number;
}

export class PercentPreferenceVarianceAdjuster implements PreferenceVarianceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPreferenceVarianceAdjuster implements PreferenceVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PreferenceVarianceImpressionsOffsetAdjuster implements PreferenceVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: PreferenceVariance, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class FlaggedPreferenceVarianceAdjuster implements PreferenceVarianceFactor {
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

  adjust(item: PreferenceVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the preference variance steps in order and keeps a trace of each. */
export class PreferenceVarianceEngine {
  steps: PreferenceVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PreferenceVariance): number {
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

  evaluateAll(items: PreferenceVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPreferenceVarianceEngine(flagsValue: flags.Registry): PreferenceVarianceEngine {
  return new PreferenceVarianceEngine(
    [
      new PercentPreferenceVarianceAdjuster(1.3),
      new RoundingPreferenceVarianceAdjuster(0.25),
      new PreferenceVarianceImpressionsOffsetAdjuster(1.58),
      new FlaggedPreferenceVarianceAdjuster(flagsValue, "preference-variance-batched", 1.7),
    ],
    [],
    0.8,
    7386.6,
  );
}
