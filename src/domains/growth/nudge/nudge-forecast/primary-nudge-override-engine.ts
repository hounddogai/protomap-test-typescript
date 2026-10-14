import * as flags from "../../../../kit/flags.js";
import { PrimaryNudgeOverride } from "./primary-nudge-override.js";

/** One step of the primary nudge override calculation. */
export interface PrimaryNudgeOverrideAdjuster {
  describe(): string;
  adjust(item: PrimaryNudgeOverride, value: number): number;
}

export class PercentPrimaryNudgeOverrideAdjuster implements PrimaryNudgeOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryNudgeOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryNudgeOverrideAdjuster implements PrimaryNudgeOverrideAdjuster {
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

  adjust(item: PrimaryNudgeOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimaryNudgeOverrideAdjuster implements PrimaryNudgeOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryNudgeOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPrimaryNudgeOverrideAdjuster implements PrimaryNudgeOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryNudgeOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PrimaryNudgeOverrideCreatedAtOffsetAdjuster implements PrimaryNudgeOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: PrimaryNudgeOverride, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the primary nudge override steps in order and keeps a trace of each. */
export class PrimaryNudgeOverrideEngine {
  steps: PrimaryNudgeOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryNudgeOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryNudgeOverride): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PrimaryNudgeOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryNudgeOverrideEngine(flagsValue: flags.Registry): PrimaryNudgeOverrideEngine {
  return new PrimaryNudgeOverrideEngine(
    [
      new PercentPrimaryNudgeOverrideAdjuster(-6.5),
      new FlaggedPrimaryNudgeOverrideAdjuster(flagsValue, "primary-nudge-override-pending", 9.5),
      new TieredPrimaryNudgeOverrideAdjuster([3653, 3740, 4029], [1.1, 0.94, 1.13]),
      new MinimumPrimaryNudgeOverrideAdjuster(45.2),
      new PrimaryNudgeOverrideCreatedAtOffsetAdjuster(0.79),
    ],
    [],
    4.8,
    12892.1,
  );
}
