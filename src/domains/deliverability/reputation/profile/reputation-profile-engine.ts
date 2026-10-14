import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationProfile } from "./reputation-profile.js";

/** One step of the reputation profile calculation. */
export interface ReputationProfileAdjuster {
  describe(): string;
  adjust(item: ReputationProfile, value: number): number;
}

export class MinimumReputationProfileAdjuster implements ReputationProfileAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapReputationProfileAdjuster implements ReputationProfileAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedReputationProfileAdjuster implements ReputationProfileAdjuster {
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

  adjust(item: ReputationProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentReputationProfileAdjuster implements ReputationProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingReputationProfileAdjuster implements ReputationProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reputation profile steps in order and keeps a trace of each. */
export class ReputationProfileEngine {
  steps: ReputationProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReputationProfile): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ReputationProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReputationProfileEngine(flagsValue: flags.Registry): ReputationProfileEngine {
  return new ReputationProfileEngine(
    [
      new MinimumReputationProfileAdjuster(21.6),
      new CapReputationProfileAdjuster(9405),
      new FlaggedReputationProfileAdjuster(flagsValue, "reputation-profile-seasonal", 4.9),
      new PercentReputationProfileAdjuster(-21.9),
      new RoundingReputationProfileAdjuster(1),
    ],
    [],
    2.9,
    68121.8,
  );
}
