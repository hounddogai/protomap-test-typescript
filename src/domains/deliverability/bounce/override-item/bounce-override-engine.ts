import * as flags from "../../../../kit/flags.js";
import { BounceOverride } from "./bounce-override.js";

/** One step of the bounce override calculation. */
export interface BounceOverrideStep {
  describe(): string;
  adjust(item: BounceOverride, value: number): number;
}

export class FlaggedBounceOverrideAdjuster implements BounceOverrideStep {
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

  adjust(item: BounceOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BounceOverrideThresholdOffsetAdjuster implements BounceOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: BounceOverride, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapBounceOverrideAdjuster implements BounceOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBounceOverrideAdjuster implements BounceOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the bounce override steps in order and keeps a trace of each. */
export class BounceOverrideEngine {
  steps: BounceOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BounceOverride): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: BounceOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBounceOverrideEngine(flagsValue: flags.Registry): BounceOverrideEngine {
  return new BounceOverrideEngine(
    [
      new FlaggedBounceOverrideAdjuster(flagsValue, "bounce-override-capped", 8.7),
      new BounceOverrideThresholdOffsetAdjuster(1.92),
      new CapBounceOverrideAdjuster(35636),
      new MinimumBounceOverrideAdjuster(33.8),
    ],
    [],
    0.2,
    16309.1,
  );
}
