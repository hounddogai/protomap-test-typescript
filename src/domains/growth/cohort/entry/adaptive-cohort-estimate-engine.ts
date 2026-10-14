import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

/** One step of the adaptive cohort estimate calculation. */
export interface AdaptiveCohortEstimateStep {
  describe(): string;
  adjust(item: AdaptiveCohortEstimate, value: number): number;
}

export class FlaggedAdaptiveCohortEstimateAdjuster implements AdaptiveCohortEstimateStep {
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

  adjust(item: AdaptiveCohortEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveCohortEstimateAdjuster implements AdaptiveCohortEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveCohortEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveCohortEstimateClicksOffsetAdjuster implements AdaptiveCohortEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: AdaptiveCohortEstimate, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class PercentAdaptiveCohortEstimateAdjuster implements AdaptiveCohortEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveCohortEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveCohortEstimateAdjuster implements AdaptiveCohortEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveCohortEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive cohort estimate steps in order and keeps a trace of each. */
export class AdaptiveCohortEstimateEngine {
  steps: AdaptiveCohortEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCohortEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveCohortEstimate): number {
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

  evaluateAll(items: AdaptiveCohortEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveCohortEstimateEngine(flagsValue: flags.Registry): AdaptiveCohortEstimateEngine {
  return new AdaptiveCohortEstimateEngine(
    [
      new FlaggedAdaptiveCohortEstimateAdjuster(flagsValue, "adaptive-cohort-estimate-regional", 9),
      new RoundingAdaptiveCohortEstimateAdjuster(1),
      new AdaptiveCohortEstimateClicksOffsetAdjuster(1.92),
      new PercentAdaptiveCohortEstimateAdjuster(-12.9),
      new MinimumAdaptiveCohortEstimateAdjuster(46.6),
    ],
    [],
    1.9,
    71986.7,
  );
}
