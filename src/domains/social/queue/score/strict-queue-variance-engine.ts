import * as flags from "../../../../kit/flags.js";
import { StrictQueueVariance } from "./strict-queue-variance.js";

/** One step of the strict queue variance calculation. */
export interface StrictQueueVarianceStep {
  describe(): string;
  adjust(item: StrictQueueVariance, value: number): number;
}

export class FlaggedStrictQueueVarianceAdjuster implements StrictQueueVarianceStep {
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

  adjust(item: StrictQueueVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictQueueVarianceAdjuster implements StrictQueueVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictQueueVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictQueueVarianceAdjuster implements StrictQueueVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictQueueVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict queue variance steps in order and keeps a trace of each. */
export class StrictQueueVarianceEngine {
  steps: StrictQueueVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictQueueVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictQueueVariance): number {
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

  evaluateAll(items: StrictQueueVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictQueueVarianceEngine(flagsValue: flags.Registry): StrictQueueVarianceEngine {
  return new StrictQueueVarianceEngine(
    [
      new FlaggedStrictQueueVarianceAdjuster(flagsValue, "strict-queue-variance-strict", -5.9),
      new CapStrictQueueVarianceAdjuster(597),
      new PercentStrictQueueVarianceAdjuster(21.6),
    ],
    [],
    3.3,
    46584.4,
  );
}
