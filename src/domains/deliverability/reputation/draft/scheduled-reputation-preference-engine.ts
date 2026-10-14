import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledReputationPreference } from "./scheduled-reputation-preference.js";

/** One step of the scheduled reputation preference calculation. */
export interface ScheduledReputationPreferenceStep {
  describe(): string;
  adjust(item: ScheduledReputationPreference, value: number): number;
}

export class PercentScheduledReputationPreferenceAdjuster implements ScheduledReputationPreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledReputationPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledReputationPreferenceAdjuster implements ScheduledReputationPreferenceStep {
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

  adjust(item: ScheduledReputationPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledReputationPreferenceAdjuster implements ScheduledReputationPreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledReputationPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled reputation preference steps in order and keeps a trace of each. */
export class ScheduledReputationPreferenceEngine {
  steps: ScheduledReputationPreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledReputationPreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledReputationPreference): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ScheduledReputationPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledReputationPreferenceEngine(flagsValue: flags.Registry): ScheduledReputationPreferenceEngine {
  return new ScheduledReputationPreferenceEngine(
    [
      new PercentScheduledReputationPreferenceAdjuster(22.7),
      new FlaggedScheduledReputationPreferenceAdjuster(
        flagsValue,
        "scheduled-reputation-preference-batched",
        1.4,
      ),
      new TieredScheduledReputationPreferenceAdjuster([1101, 3645, 4506], [1.1, 1.17, 1.03]),
    ],
    [],
    0.5,
    60098.6,
  );
}
