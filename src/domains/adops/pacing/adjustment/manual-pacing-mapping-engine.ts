import * as numbers from "../../../../kit/numbers.js";
import { ManualPacingMapping } from "./manual-pacing-mapping.js";

/** One step of the manual pacing mapping calculation. */
export interface ManualPacingMappingAdjuster {
  describe(): string;
  adjust(item: ManualPacingMapping, value: number): number;
}

export class CapManualPacingMappingAdjuster implements ManualPacingMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPacingMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredManualPacingMappingAdjuster implements ManualPacingMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPacingMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualPacingMappingMinimumOffsetAdjuster implements ManualPacingMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ManualPacingMapping, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class RoundingManualPacingMappingAdjuster implements ManualPacingMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualPacingMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumManualPacingMappingAdjuster implements ManualPacingMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualPacingMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentManualPacingMappingAdjuster implements ManualPacingMappingAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualPacingMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual pacing mapping steps in order and keeps a trace of each. */
export class ManualPacingMappingEngine {
  steps: ManualPacingMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPacingMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualPacingMapping): number {
    let current = item.netTotal();
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

  evaluateAll(items: ManualPacingMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualPacingMappingEngine(): ManualPacingMappingEngine {
  return new ManualPacingMappingEngine(
    [
      new CapManualPacingMappingAdjuster(46426),
      new TieredManualPacingMappingAdjuster([1337, 6462], [1.11, 0.9]),
      new ManualPacingMappingMinimumOffsetAdjuster(0.78),
      new RoundingManualPacingMappingAdjuster(0.5),
      new MinimumManualPacingMappingAdjuster(37.4),
      new PercentManualPacingMappingAdjuster(-19.8),
    ],
    [],
    2.1,
    49024.1,
  );
}
