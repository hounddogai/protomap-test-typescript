import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalFrequencyAllocation } from "./regional-frequency-allocation.js";

/** One step of the regional frequency allocation calculation. */
export interface RegionalFrequencyAllocationFactor {
  describe(): string;
  adjust(item: RegionalFrequencyAllocation, value: number): number;
}

export class MinimumRegionalFrequencyAllocationAdjuster implements RegionalFrequencyAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalFrequencyAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalFrequencyAllocationAdjuster implements RegionalFrequencyAllocationFactor {
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

  adjust(item: RegionalFrequencyAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalFrequencyAllocationWindowDaysOffsetAdjuster implements RegionalFrequencyAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RegionalFrequencyAllocation, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RegionRegionalFrequencyAllocationAdjuster implements RegionalFrequencyAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RegionalFrequencyAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRegionalFrequencyAllocationAdjuster implements RegionalFrequencyAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalFrequencyAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional frequency allocation steps in order and keeps a trace of each. */
export class RegionalFrequencyAllocationEngine {
  steps: RegionalFrequencyAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalFrequencyAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalFrequencyAllocation): number {
    let current = item.netLoad();
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

  evaluateAll(items: RegionalFrequencyAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalFrequencyAllocationEngine(flagsValue: flags.Registry): RegionalFrequencyAllocationEngine {
  return new RegionalFrequencyAllocationEngine(
    [
      new MinimumRegionalFrequencyAllocationAdjuster(27.1),
      new FlaggedRegionalFrequencyAllocationAdjuster(flagsValue, "regional-frequency-allocation-manual", -2.4),
      new RegionalFrequencyAllocationWindowDaysOffsetAdjuster(0.31),
      new RegionRegionalFrequencyAllocationAdjuster(
        new Map<string, number>([["east", 1.11], ["west", 1.03], ["online", 0.78]]),
      ),
      new RoundingRegionalFrequencyAllocationAdjuster(5),
    ],
    [],
    1,
    70290.2,
  );
}
