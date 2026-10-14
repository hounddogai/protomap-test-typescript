import * as flags from "../../../../kit/flags.js";
import { FallbackPlacementTier } from "./fallback-placement-tier.js";

/** One step of the fallback placement tier calculation. */
export interface FallbackPlacementTierStep {
  describe(): string;
  adjust(item: FallbackPlacementTier, value: number): number;
}

export class CapFallbackPlacementTierAdjuster implements FallbackPlacementTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPlacementTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackPlacementTierCostOffsetAdjuster implements FallbackPlacementTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: FallbackPlacementTier, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedFallbackPlacementTierAdjuster implements FallbackPlacementTierStep {
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

  adjust(item: FallbackPlacementTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackPlacementTierAdjuster implements FallbackPlacementTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackPlacementTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackPlacementTierAdjuster implements FallbackPlacementTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPlacementTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback placement tier steps in order and keeps a trace of each. */
export class FallbackPlacementTierEngine {
  steps: FallbackPlacementTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPlacementTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackPlacementTier): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: FallbackPlacementTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackPlacementTierEngine(flagsValue: flags.Registry): FallbackPlacementTierEngine {
  return new FallbackPlacementTierEngine(
    [
      new CapFallbackPlacementTierAdjuster(8179),
      new FallbackPlacementTierCostOffsetAdjuster(1.59),
      new FlaggedFallbackPlacementTierAdjuster(flagsValue, "fallback-placement-tier-default", 0.2),
      new MinimumFallbackPlacementTierAdjuster(7.4),
      new PercentFallbackPlacementTierAdjuster(-11.3),
    ],
    [],
    0.9,
    92447.2,
  );
}
