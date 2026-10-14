import * as flags from "../../../../kit/flags.js";
import { FraudCheckTarget } from "./fraud-check-target.js";

/** One step of the fraud check target calculation. */
export interface FraudCheckTargetAdjuster {
  describe(): string;
  adjust(item: FraudCheckTarget, value: number): number;
}

export class CapFraudCheckTargetAdjuster implements FraudCheckTargetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFraudCheckTargetAdjuster implements FraudCheckTargetAdjuster {
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

  adjust(item: FraudCheckTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFraudCheckTargetAdjuster implements FraudCheckTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fraud check target steps in order and keeps a trace of each. */
export class FraudCheckTargetEngine {
  steps: FraudCheckTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FraudCheckTarget): number {
    let current = item.netTotal();
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

  evaluateAll(items: FraudCheckTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFraudCheckTargetEngine(flagsValue: flags.Registry): FraudCheckTargetEngine {
  return new FraudCheckTargetEngine(
    [
      new CapFraudCheckTargetAdjuster(5919),
      new FlaggedFraudCheckTargetAdjuster(flagsValue, "fraud-check-target-global", 2.6),
      new MinimumFraudCheckTargetAdjuster(39.9),
    ],
    [],
    2.7,
    95637.7,
  );
}
