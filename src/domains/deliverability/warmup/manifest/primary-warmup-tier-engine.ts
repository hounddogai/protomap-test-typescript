import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryWarmupTier } from "./primary-warmup-tier.js";

/** One step of the primary warmup tier calculation. */
export interface PrimaryWarmupTierAdjuster {
  describe(): string;
  adjust(item: PrimaryWarmupTier, value: number): number;
}

export class FlaggedPrimaryWarmupTierAdjuster implements PrimaryWarmupTierAdjuster {
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

  adjust(item: PrimaryWarmupTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryWarmupTierAdjuster implements PrimaryWarmupTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryWarmupTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryWarmupTierAdjuster implements PrimaryWarmupTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryWarmupTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPrimaryWarmupTierAdjuster implements PrimaryWarmupTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryWarmupTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPrimaryWarmupTierAdjuster implements PrimaryWarmupTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryWarmupTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary warmup tier steps in order and keeps a trace of each. */
export class PrimaryWarmupTierEngine {
  steps: PrimaryWarmupTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryWarmupTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryWarmupTier): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PrimaryWarmupTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryWarmupTierEngine(flagsValue: flags.Registry): PrimaryWarmupTierEngine {
  return new PrimaryWarmupTierEngine(
    [
      new FlaggedPrimaryWarmupTierAdjuster(flagsValue, "primary-warmup-tier-batched", -2.4),
      new RoundingPrimaryWarmupTierAdjuster(5),
      new TieredPrimaryWarmupTierAdjuster([6072, 8172], [1.17, 0.9]),
      new CapPrimaryWarmupTierAdjuster(39647),
      new MinimumPrimaryWarmupTierAdjuster(29.2),
    ],
    [],
    4,
    68150.3,
  );
}
