import * as flags from "../../../../kit/flags.js";
import { TieredFraudCheckPreference } from "./tiered-fraud-check-preference.js";

/** One step of the tiered fraud check preference calculation. */
export interface TieredFraudCheckPreferenceFactor {
  describe(): string;
  adjust(item: TieredFraudCheckPreference, value: number): number;
}

export class CapTieredFraudCheckPreferenceAdjuster implements TieredFraudCheckPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredFraudCheckPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredFraudCheckPreferenceAdjuster implements TieredFraudCheckPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredFraudCheckPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredFraudCheckPreferenceAdjuster implements TieredFraudCheckPreferenceFactor {
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

  adjust(item: TieredFraudCheckPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered fraud check preference steps in order and keeps a trace of each. */
export class TieredFraudCheckPreferenceEngine {
  steps: TieredFraudCheckPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFraudCheckPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredFraudCheckPreference): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: TieredFraudCheckPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredFraudCheckPreferenceEngine(flagsValue: flags.Registry): TieredFraudCheckPreferenceEngine {
  return new TieredFraudCheckPreferenceEngine(
    [
      new CapTieredFraudCheckPreferenceAdjuster(30591),
      new PercentTieredFraudCheckPreferenceAdjuster(-8.9),
      new FlaggedTieredFraudCheckPreferenceAdjuster(flagsValue, "tiered-fraud-check-preference-tiered", 9.1),
    ],
    [],
    0.2,
    39012.6,
  );
}
