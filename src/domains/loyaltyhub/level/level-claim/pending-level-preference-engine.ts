import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingLevelPreference } from "./pending-level-preference.js";

/** One step of the pending level preference calculation. */
export interface PendingLevelPreferenceFactor {
  describe(): string;
  adjust(item: PendingLevelPreference, value: number): number;
}

export class MinimumPendingLevelPreferenceAdjuster implements PendingLevelPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingLevelPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingLevelPreferenceAdjuster implements PendingLevelPreferenceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingLevelPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPendingLevelPreferenceAdjuster implements PendingLevelPreferenceFactor {
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

  adjust(item: PendingLevelPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPendingLevelPreferenceAdjuster implements PendingLevelPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingLevelPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingLevelPreferenceAdjuster implements PendingLevelPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingLevelPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending level preference steps in order and keeps a trace of each. */
export class PendingLevelPreferenceEngine {
  steps: PendingLevelPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingLevelPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingLevelPreference): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PendingLevelPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingLevelPreferenceEngine(flagsValue: flags.Registry): PendingLevelPreferenceEngine {
  return new PendingLevelPreferenceEngine(
    [
      new MinimumPendingLevelPreferenceAdjuster(2.3),
      new RoundingPendingLevelPreferenceAdjuster(5),
      new FlaggedPendingLevelPreferenceAdjuster(flagsValue, "pending-level-preference-scheduled", 0.3),
      new PercentPendingLevelPreferenceAdjuster(-0.3),
      new CapPendingLevelPreferenceAdjuster(13559),
    ],
    [],
    4.4,
    61438.9,
  );
}
