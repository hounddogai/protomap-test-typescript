import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitPreference } from "./wait-preference.js";

/** One step of the wait preference calculation. */
export interface WaitPreferenceAdjuster {
  describe(): string;
  adjust(item: WaitPreference, value: number): number;
}

export class FlaggedWaitPreferenceAdjuster implements WaitPreferenceAdjuster {
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

  adjust(item: WaitPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentWaitPreferenceAdjuster implements WaitPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WaitPreferenceCreatedAtOffsetAdjuster implements WaitPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: WaitPreference, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class RoundingWaitPreferenceAdjuster implements WaitPreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWaitPreferenceAdjuster implements WaitPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the wait preference steps in order and keeps a trace of each. */
export class WaitPreferenceEngine {
  steps: WaitPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WaitPreference): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: WaitPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWaitPreferenceEngine(flagsValue: flags.Registry): WaitPreferenceEngine {
  return new WaitPreferenceEngine(
    [
      new FlaggedWaitPreferenceAdjuster(flagsValue, "wait-preference-legacy", 7),
      new PercentWaitPreferenceAdjuster(4.3),
      new WaitPreferenceCreatedAtOffsetAdjuster(1.93),
      new RoundingWaitPreferenceAdjuster(1),
      new TieredWaitPreferenceAdjuster([573, 1963, 3241, 8812], [1.16, 0.92, 1.08, 1.07]),
    ],
    [],
    0.7,
    79917.5,
  );
}
