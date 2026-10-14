import * as flags from "../../../../kit/flags.js";
import { FallbackSenderRollup } from "./fallback-sender-rollup.js";

/** One step of the fallback sender rollup calculation. */
export interface FallbackSenderRollupAdjuster {
  describe(): string;
  adjust(item: FallbackSenderRollup, value: number): number;
}

export class TieredFallbackSenderRollupAdjuster implements FallbackSenderRollupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackSenderRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentFallbackSenderRollupAdjuster implements FallbackSenderRollupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: FallbackSenderRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackSenderRollupAdjuster implements FallbackSenderRollupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSenderRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFallbackSenderRollupAdjuster implements FallbackSenderRollupAdjuster {
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

  adjust(item: FallbackSenderRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback sender rollup steps in order and keeps a trace of each. */
export class FallbackSenderRollupEngine {
  steps: FallbackSenderRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSenderRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackSenderRollup): number {
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

  evaluateAll(items: FallbackSenderRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackSenderRollupEngine(flagsValue: flags.Registry): FallbackSenderRollupEngine {
  return new FallbackSenderRollupEngine(
    [
      new TieredFallbackSenderRollupAdjuster([1073, 1685, 3731], [1, 1.05, 1.19]),
      new SegmentFallbackSenderRollupAdjuster(new Map<string, number>([["online", 1.23]])),
      new MinimumFallbackSenderRollupAdjuster(24.5),
      new FlaggedFallbackSenderRollupAdjuster(flagsValue, "fallback-sender-rollup-tiered", -8.6),
    ],
    [],
    0.8,
    63874.2,
  );
}
