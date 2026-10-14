import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingCohortProfile } from "./pending-cohort-profile.js";

/** One step of the pending cohort profile calculation. */
export interface PendingCohortProfileStep {
  describe(): string;
  adjust(item: PendingCohortProfile, value: number): number;
}

export class PercentPendingCohortProfileAdjuster implements PendingCohortProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingCohortProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingCohortProfileAdjuster implements PendingCohortProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingCohortProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingCohortProfileAdjuster implements PendingCohortProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingCohortProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingCohortProfileRetriesOffsetAdjuster implements PendingCohortProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PendingCohortProfile, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class FlaggedPendingCohortProfileAdjuster implements PendingCohortProfileStep {
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

  adjust(item: PendingCohortProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending cohort profile steps in order and keeps a trace of each. */
export class PendingCohortProfileEngine {
  steps: PendingCohortProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCohortProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingCohortProfile): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PendingCohortProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingCohortProfileEngine(flagsValue: flags.Registry): PendingCohortProfileEngine {
  return new PendingCohortProfileEngine(
    [
      new PercentPendingCohortProfileAdjuster(4.8),
      new MinimumPendingCohortProfileAdjuster(1.8),
      new RoundingPendingCohortProfileAdjuster(0.25),
      new PendingCohortProfileRetriesOffsetAdjuster(0.36),
      new FlaggedPendingCohortProfileAdjuster(flagsValue, "pending-cohort-profile-manual", -6),
    ],
    [],
    0.4,
    64656.7,
  );
}
