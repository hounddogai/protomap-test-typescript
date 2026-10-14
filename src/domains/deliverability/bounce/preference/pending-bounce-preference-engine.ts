import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingBouncePreference } from "./pending-bounce-preference.js";

/** One step of the pending bounce preference calculation. */
export interface PendingBouncePreferenceAdjuster {
  describe(): string;
  adjust(item: PendingBouncePreference, value: number): number;
}

export class PercentPendingBouncePreferenceAdjuster implements PendingBouncePreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBouncePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPendingBouncePreferenceAdjuster implements PendingBouncePreferenceAdjuster {
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

  adjust(item: PendingBouncePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingBouncePreferenceAdjuster implements PendingBouncePreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBouncePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingBouncePreferenceAdjuster implements PendingBouncePreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBouncePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending bounce preference steps in order and keeps a trace of each. */
export class PendingBouncePreferenceEngine {
  steps: PendingBouncePreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBouncePreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingBouncePreference): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PendingBouncePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingBouncePreferenceEngine(flagsValue: flags.Registry): PendingBouncePreferenceEngine {
  return new PendingBouncePreferenceEngine(
    [
      new PercentPendingBouncePreferenceAdjuster(16.8),
      new FlaggedPendingBouncePreferenceAdjuster(flagsValue, "pending-bounce-preference-default", -4.3),
      new MinimumPendingBouncePreferenceAdjuster(37.1),
      new RoundingPendingBouncePreferenceAdjuster(0.05),
    ],
    [],
    4.3,
    14397.9,
  );
}
