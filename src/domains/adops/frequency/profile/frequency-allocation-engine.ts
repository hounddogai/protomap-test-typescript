import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FrequencyAllocation } from "./frequency-allocation.js";

/** One step of the frequency allocation calculation. */
export interface FrequencyAllocationFactor {
  describe(): string;
  adjust(item: FrequencyAllocation, value: number): number;
}

export class CapFrequencyAllocationAdjuster implements FrequencyAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFrequencyAllocationAdjuster implements FrequencyAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFrequencyAllocationAdjuster implements FrequencyAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FrequencyAllocationScoreOffsetAdjuster implements FrequencyAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: FrequencyAllocation, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedFrequencyAllocationAdjuster implements FrequencyAllocationFactor {
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

  adjust(item: FrequencyAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFrequencyAllocationAdjuster implements FrequencyAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencyAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the frequency allocation steps in order and keeps a trace of each. */
export class FrequencyAllocationEngine {
  steps: FrequencyAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FrequencyAllocation): number {
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

  evaluateAll(items: FrequencyAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFrequencyAllocationEngine(flagsValue: flags.Registry): FrequencyAllocationEngine {
  return new FrequencyAllocationEngine(
    [
      new CapFrequencyAllocationAdjuster(15839),
      new RoundingFrequencyAllocationAdjuster(0.1),
      new PercentFrequencyAllocationAdjuster(-10.6),
      new FrequencyAllocationScoreOffsetAdjuster(0.63),
      new FlaggedFrequencyAllocationAdjuster(flagsValue, "frequency-allocation-scheduled", 2.3),
      new TieredFrequencyAllocationAdjuster([2050, 4716], [1.07, 0.97]),
    ],
    [],
    0.9,
    19900,
  );
}
