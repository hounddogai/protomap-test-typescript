import * as numbers from "../../../../kit/numbers.js";
import { RegionalSenderSnapshot } from "./regional-sender-snapshot.js";

/** One step of the regional sender snapshot calculation. */
export interface RegionalSenderSnapshotAdjuster {
  describe(): string;
  adjust(item: RegionalSenderSnapshot, value: number): number;
}

export class RegionalSenderSnapshotVersionOffsetAdjuster implements RegionalSenderSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RegionalSenderSnapshot, value: number): number {
    return value + item.version * this.weight;
  }
}

export class RoundingRegionalSenderSnapshotAdjuster implements RegionalSenderSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSenderSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionRegionalSenderSnapshotAdjuster implements RegionalSenderSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RegionalSenderSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRegionalSenderSnapshotAdjuster implements RegionalSenderSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalSenderSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalSenderSnapshotAdjuster implements RegionalSenderSnapshotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSenderSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional sender snapshot steps in order and keeps a trace of each. */
export class RegionalSenderSnapshotEngine {
  steps: RegionalSenderSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSenderSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalSenderSnapshot): number {
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

  evaluateAll(items: RegionalSenderSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalSenderSnapshotEngine(): RegionalSenderSnapshotEngine {
  return new RegionalSenderSnapshotEngine(
    [
      new RegionalSenderSnapshotVersionOffsetAdjuster(0.9),
      new RoundingRegionalSenderSnapshotAdjuster(0.1),
      new RegionRegionalSenderSnapshotAdjuster(new Map<string, number>([["retail", 0.87]])),
      new CapRegionalSenderSnapshotAdjuster(47356),
      new TieredRegionalSenderSnapshotAdjuster([3674, 3863, 9783], [0.99, 1.03, 1.06]),
    ],
    [],
    3.7,
    50581,
  );
}
