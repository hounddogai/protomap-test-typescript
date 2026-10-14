import * as flags from "../../../../kit/flags.js";
import { FunnelGroup } from "./funnel-group.js";

/** One step of the funnel group calculation. */
export interface FunnelGroupAdjuster {
  describe(): string;
  adjust(item: FunnelGroup, value: number): number;
}

export class MinimumFunnelGroupAdjuster implements FunnelGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFunnelGroupAdjuster implements FunnelGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFunnelGroupAdjuster implements FunnelGroupAdjuster {
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

  adjust(item: FunnelGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel group steps in order and keeps a trace of each. */
export class FunnelGroupEngine {
  steps: FunnelGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FunnelGroup): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: FunnelGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFunnelGroupEngine(flagsValue: flags.Registry): FunnelGroupEngine {
  return new FunnelGroupEngine(
    [
      new MinimumFunnelGroupAdjuster(25),
      new CapFunnelGroupAdjuster(24471),
      new FlaggedFunnelGroupAdjuster(flagsValue, "funnel-group-rolling", -2.3),
    ],
    [],
    0.5,
    55689.8,
  );
}
