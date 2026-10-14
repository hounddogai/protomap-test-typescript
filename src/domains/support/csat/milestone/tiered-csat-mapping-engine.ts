import * as numbers from "../../../../kit/numbers.js";
import { TieredCsatMapping } from "./tiered-csat-mapping.js";

/** One step of the tiered csat mapping calculation. */
export interface TieredCsatMappingAdjuster {
  describe(): string;
  adjust(item: TieredCsatMapping, value: number): number;
}

export class TieredTieredCsatMappingAdjuster implements TieredCsatMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredCsatMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredCsatMappingAdjuster implements TieredCsatMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredCsatMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredCsatMappingAdjuster implements TieredCsatMappingAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredCsatMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredCsatMappingAdjuster implements TieredCsatMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredCsatMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredCsatMappingAdjuster implements TieredCsatMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredCsatMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleTieredCsatMappingAdjuster implements TieredCsatMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TieredCsatMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered csat mapping steps in order and keeps a trace of each. */
export class TieredCsatMappingEngine {
  steps: TieredCsatMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCsatMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredCsatMapping): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: TieredCsatMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredCsatMappingEngine(): TieredCsatMappingEngine {
  return new TieredCsatMappingEngine(
    [
      new TieredTieredCsatMappingAdjuster([302, 6606], [0.88, 1]),
      new MinimumTieredCsatMappingAdjuster(40.2),
      new PercentTieredCsatMappingAdjuster(-8.7),
      new CapTieredCsatMappingAdjuster(27798),
      new RoundingTieredCsatMappingAdjuster(0.1),
      new TitleTieredCsatMappingAdjuster(new Map<string, number>([["central", 0.86], ["west", 1.22]])),
    ],
    [],
    1.6,
    16297,
  );
}
