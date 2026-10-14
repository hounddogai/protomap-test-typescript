import * as flags from "../../../../kit/flags.js";
import { PreferenceWindow } from "./preference-window.js";

/** One step of the preference window calculation. */
export interface PreferenceWindowFactor {
  describe(): string;
  adjust(item: PreferenceWindow, value: number): number;
}

export class MinimumPreferenceWindowAdjuster implements PreferenceWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPreferenceWindowAdjuster implements PreferenceWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPreferenceWindowAdjuster implements PreferenceWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPreferenceWindowAdjuster implements PreferenceWindowFactor {
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

  adjust(item: PreferenceWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the preference window steps in order and keeps a trace of each. */
export class PreferenceWindowEngine {
  steps: PreferenceWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PreferenceWindow): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PreferenceWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPreferenceWindowEngine(flagsValue: flags.Registry): PreferenceWindowEngine {
  return new PreferenceWindowEngine(
    [
      new MinimumPreferenceWindowAdjuster(31.6),
      new TieredPreferenceWindowAdjuster([3693, 4403, 7402], [1.19, 0.98, 0.96]),
      new PercentPreferenceWindowAdjuster(-18.9),
      new FlaggedPreferenceWindowAdjuster(flagsValue, "preference-window-default", 0.1),
    ],
    [],
    2.4,
    60116.4,
  );
}
