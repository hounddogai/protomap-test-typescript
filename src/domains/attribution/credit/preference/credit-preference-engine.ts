import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditPreference } from "./credit-preference.js";

/** One step of the credit preference calculation. */
export interface CreditPreferenceFactor {
  describe(): string;
  adjust(item: CreditPreference, value: number): number;
}

export class RoundingCreditPreferenceAdjuster implements CreditPreferenceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCreditPreferenceAdjuster implements CreditPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCreditPreferenceAdjuster implements CreditPreferenceFactor {
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

  adjust(item: CreditPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit preference steps in order and keeps a trace of each. */
export class CreditPreferenceEngine {
  steps: CreditPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreditPreference): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: CreditPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreditPreferenceEngine(flagsValue: flags.Registry): CreditPreferenceEngine {
  return new CreditPreferenceEngine(
    [
      new RoundingCreditPreferenceAdjuster(0.1),
      new PercentCreditPreferenceAdjuster(8.6),
      new FlaggedCreditPreferenceAdjuster(flagsValue, "credit-preference-batched", -7.9),
    ],
    [],
    0.5,
    38726.7,
  );
}
