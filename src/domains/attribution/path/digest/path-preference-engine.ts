import * as flags from "../../../../kit/flags.js";
import { PathPreference } from "./path-preference.js";

/** One step of the path preference calculation. */
export interface PathPreferenceFactor {
  describe(): string;
  adjust(item: PathPreference, value: number): number;
}

export class PathPreferenceOpenRateOffsetAdjuster implements PathPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: PathPreference, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class PercentPathPreferenceAdjuster implements PathPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPathPreferenceAdjuster implements PathPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPathPreferenceAdjuster implements PathPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPathPreferenceAdjuster implements PathPreferenceFactor {
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

  adjust(item: PathPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the path preference steps in order and keeps a trace of each. */
export class PathPreferenceEngine {
  steps: PathPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PathPreference): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PathPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPathPreferenceEngine(flagsValue: flags.Registry): PathPreferenceEngine {
  return new PathPreferenceEngine(
    [
      new PathPreferenceOpenRateOffsetAdjuster(0.93),
      new PercentPathPreferenceAdjuster(-2.3),
      new MinimumPathPreferenceAdjuster(3.2),
      new CapPathPreferenceAdjuster(41917),
      new FlaggedPathPreferenceAdjuster(flagsValue, "path-preference-manual", 1.3),
    ],
    [],
    3.3,
    9853.4,
  );
}
