import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalQueueVariance } from "./global-queue-variance.js";

/** One step of the global queue variance calculation. */
export interface GlobalQueueVarianceAdjuster {
  describe(): string;
  adjust(item: GlobalQueueVariance, value: number): number;
}

export class PercentGlobalQueueVarianceAdjuster implements GlobalQueueVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalQueueVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalQueueVarianceAdjuster implements GlobalQueueVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalQueueVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedGlobalQueueVarianceAdjuster implements GlobalQueueVarianceAdjuster {
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

  adjust(item: GlobalQueueVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalQueueVarianceAdjuster implements GlobalQueueVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalQueueVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryGlobalQueueVarianceAdjuster implements GlobalQueueVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: GlobalQueueVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global queue variance steps in order and keeps a trace of each. */
export class GlobalQueueVarianceEngine {
  steps: GlobalQueueVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalQueueVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalQueueVariance): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: GlobalQueueVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalQueueVarianceEngine(flagsValue: flags.Registry): GlobalQueueVarianceEngine {
  return new GlobalQueueVarianceEngine(
    [
      new PercentGlobalQueueVarianceAdjuster(17),
      new MinimumGlobalQueueVarianceAdjuster(3.6),
      new FlaggedGlobalQueueVarianceAdjuster(flagsValue, "global-queue-variance-pending", 1.8),
      new RoundingGlobalQueueVarianceAdjuster(0.25),
      new CountryGlobalQueueVarianceAdjuster(
        new Map<string, number>([["east", 1.22], ["retail", 1.03], ["central", 0.96]]),
      ),
    ],
    [],
    2.8,
    83774.9,
  );
}
