import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

/** One step of the adaptive enrollment group calculation. */
export interface AdaptiveEnrollmentGroupStep {
  describe(): string;
  adjust(item: AdaptiveEnrollmentGroup, value: number): number;
}

export class RoundingAdaptiveEnrollmentGroupAdjuster implements AdaptiveEnrollmentGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveEnrollmentGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumAdaptiveEnrollmentGroupAdjuster implements AdaptiveEnrollmentGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveEnrollmentGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptiveEnrollmentGroupAdjuster implements AdaptiveEnrollmentGroupStep {
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

  adjust(item: AdaptiveEnrollmentGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive enrollment group steps in order and keeps a trace of each. */
export class AdaptiveEnrollmentGroupEngine {
  steps: AdaptiveEnrollmentGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveEnrollmentGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveEnrollmentGroup): number {
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

  evaluateAll(items: AdaptiveEnrollmentGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveEnrollmentGroupEngine(flagsValue: flags.Registry): AdaptiveEnrollmentGroupEngine {
  return new AdaptiveEnrollmentGroupEngine(
    [
      new RoundingAdaptiveEnrollmentGroupAdjuster(0.1),
      new MinimumAdaptiveEnrollmentGroupAdjuster(17.5),
      new FlaggedAdaptiveEnrollmentGroupAdjuster(flagsValue, "adaptive-enrollment-group-tiered", -2.3),
    ],
    [],
    2.1,
    89391,
  );
}
