import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalDoubleOptInRollup } from "./regional-double-opt-in-rollup.js";

/** One step of the regional double opt in rollup calculation. */
export interface RegionalDoubleOptInRollupStep {
  describe(): string;
  adjust(item: RegionalDoubleOptInRollup, value: number): number;
}

export class TitleRegionalDoubleOptInRollupAdjuster implements RegionalDoubleOptInRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalDoubleOptInRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RegionalDoubleOptInRollupCreatedAtOffsetAdjuster implements RegionalDoubleOptInRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: RegionalDoubleOptInRollup, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class RoundingRegionalDoubleOptInRollupAdjuster implements RegionalDoubleOptInRollupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalDoubleOptInRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalDoubleOptInRollupAdjuster implements RegionalDoubleOptInRollupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalDoubleOptInRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalDoubleOptInRollupAdjuster implements RegionalDoubleOptInRollupStep {
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

  adjust(item: RegionalDoubleOptInRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional double opt in rollup steps in order and keeps a trace of each. */
export class RegionalDoubleOptInRollupEngine {
  steps: RegionalDoubleOptInRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalDoubleOptInRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalDoubleOptInRollup): number {
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

  evaluateAll(items: RegionalDoubleOptInRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalDoubleOptInRollupEngine(flagsValue: flags.Registry): RegionalDoubleOptInRollupEngine {
  return new RegionalDoubleOptInRollupEngine(
    [
      new TitleRegionalDoubleOptInRollupAdjuster(
        new Map<string, number>([["south", 0.72], ["online", 1.08], ["east", 1.18]]),
      ),
      new RegionalDoubleOptInRollupCreatedAtOffsetAdjuster(1.42),
      new RoundingRegionalDoubleOptInRollupAdjuster(0.05),
      new MinimumRegionalDoubleOptInRollupAdjuster(8.7),
      new FlaggedRegionalDoubleOptInRollupAdjuster(flagsValue, "regional-double-opt-in-rollup-strict", 9.1),
    ],
    [],
    4.7,
    17224.6,
  );
}
