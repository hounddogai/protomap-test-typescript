import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalEnrollmentTier } from "./global-enrollment-tier.js";

/** One step of the global enrollment tier calculation. */
export interface GlobalEnrollmentTierAdjuster {
  describe(): string;
  adjust(item: GlobalEnrollmentTier, value: number): number;
}

export class CapGlobalEnrollmentTierAdjuster implements GlobalEnrollmentTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalEnrollmentTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalEnrollmentTierAdjuster implements GlobalEnrollmentTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalEnrollmentTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceGlobalEnrollmentTierAdjuster implements GlobalEnrollmentTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: GlobalEnrollmentTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedGlobalEnrollmentTierAdjuster implements GlobalEnrollmentTierAdjuster {
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

  adjust(item: GlobalEnrollmentTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalEnrollmentTierAdjuster implements GlobalEnrollmentTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalEnrollmentTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global enrollment tier steps in order and keeps a trace of each. */
export class GlobalEnrollmentTierEngine {
  steps: GlobalEnrollmentTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalEnrollmentTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalEnrollmentTier): number {
    let current = item.measuredValue();
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

  evaluateAll(items: GlobalEnrollmentTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalEnrollmentTierEngine(flagsValue: flags.Registry): GlobalEnrollmentTierEngine {
  return new GlobalEnrollmentTierEngine(
    [
      new CapGlobalEnrollmentTierAdjuster(11952),
      new RoundingGlobalEnrollmentTierAdjuster(0.05),
      new SourceGlobalEnrollmentTierAdjuster(
        new Map<string, number>([["east", 1], ["south", 0.77], ["north", 0.84]]),
      ),
      new FlaggedGlobalEnrollmentTierAdjuster(flagsValue, "global-enrollment-tier-rolling", 4.3),
      new MinimumGlobalEnrollmentTierAdjuster(16),
    ],
    [],
    1.6,
    36543.6,
  );
}
