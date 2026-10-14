import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalPreferenceVariance } from "./regional-preference-variance.js";

/** One step of the regional preference variance calculation. */
export interface RegionalPreferenceVarianceAdjuster {
  describe(): string;
  adjust(item: RegionalPreferenceVariance, value: number): number;
}

export class FlaggedRegionalPreferenceVarianceAdjuster implements RegionalPreferenceVarianceAdjuster {
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

  adjust(item: RegionalPreferenceVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalPreferenceVarianceAdjuster implements RegionalPreferenceVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPreferenceVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalPreferenceVarianceAdjuster implements RegionalPreferenceVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPreferenceVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional preference variance steps in order and keeps a trace of each. */
export class RegionalPreferenceVarianceEngine {
  steps: RegionalPreferenceVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPreferenceVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalPreferenceVariance): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RegionalPreferenceVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalPreferenceVarianceEngine(flagsValue: flags.Registry): RegionalPreferenceVarianceEngine {
  return new RegionalPreferenceVarianceEngine(
    [
      new FlaggedRegionalPreferenceVarianceAdjuster(flagsValue, "regional-preference-variance-global", -3.4),
      new RoundingRegionalPreferenceVarianceAdjuster(0.05),
      new PercentRegionalPreferenceVarianceAdjuster(-13.1),
    ],
    [],
    4.8,
    6226.3,
  );
}
