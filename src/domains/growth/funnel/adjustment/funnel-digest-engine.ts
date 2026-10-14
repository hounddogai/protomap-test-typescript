import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelDigest } from "./funnel-digest.js";

/** One step of the funnel digest calculation. */
export interface FunnelDigestAdjuster {
  describe(): string;
  adjust(item: FunnelDigest, value: number): number;
}

export class MinimumFunnelDigestAdjuster implements FunnelDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFunnelDigestAdjuster implements FunnelDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFunnelDigestAdjuster implements FunnelDigestAdjuster {
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

  adjust(item: FunnelDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFunnelDigestAdjuster implements FunnelDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the funnel digest steps in order and keeps a trace of each. */
export class FunnelDigestEngine {
  steps: FunnelDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelDigest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: FunnelDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelDigestEngine(flagsValue: flags.Registry): FunnelDigestEngine {
  return new FunnelDigestEngine(
    [
      new MinimumFunnelDigestAdjuster(32.3),
      new RoundingFunnelDigestAdjuster(1),
      new FlaggedFunnelDigestAdjuster(flagsValue, "funnel-digest-primary", -2.2),
      new CapFunnelDigestAdjuster(12087),
    ],
    [],
    4.7,
    38172.1,
  );
}
