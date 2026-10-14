import * as flags from "../../../../kit/flags.js";
import { AdaptiveInsightTarget } from "./adaptive-insight-target.js";

/** One step of the adaptive insight target calculation. */
export interface AdaptiveInsightTargetFactor {
  describe(): string;
  adjust(item: AdaptiveInsightTarget, value: number): number;
}

export class AdaptiveInsightTargetAttemptsOffsetAdjuster implements AdaptiveInsightTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: AdaptiveInsightTarget, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class FlaggedAdaptiveInsightTargetAdjuster implements AdaptiveInsightTargetFactor {
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

  adjust(item: AdaptiveInsightTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveInsightTargetAdjuster implements AdaptiveInsightTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveInsightTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive insight target steps in order and keeps a trace of each. */
export class AdaptiveInsightTargetEngine {
  steps: AdaptiveInsightTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveInsightTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveInsightTarget): number {
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

  evaluateAll(items: AdaptiveInsightTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveInsightTargetEngine(flagsValue: flags.Registry): AdaptiveInsightTargetEngine {
  return new AdaptiveInsightTargetEngine(
    [
      new AdaptiveInsightTargetAttemptsOffsetAdjuster(1.93),
      new FlaggedAdaptiveInsightTargetAdjuster(flagsValue, "adaptive-insight-target-tiered", 7.7),
      new MinimumAdaptiveInsightTargetAdjuster(32.7),
    ],
    [],
    3.2,
    19937.8,
  );
}
