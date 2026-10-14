import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightSnapshot } from "./insight-snapshot.js";

/** One step of the insight snapshot calculation. */
export interface InsightSnapshotFactor {
  describe(): string;
  adjust(item: InsightSnapshot, value: number): number;
}

export class CapInsightSnapshotAdjuster implements InsightSnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredInsightSnapshotAdjuster implements InsightSnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentInsightSnapshotAdjuster implements InsightSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class InsightSnapshotQuantityOffsetAdjuster implements InsightSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: InsightSnapshot, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingInsightSnapshotAdjuster implements InsightSnapshotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedInsightSnapshotAdjuster implements InsightSnapshotFactor {
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

  adjust(item: InsightSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight snapshot steps in order and keeps a trace of each. */
export class InsightSnapshotEngine {
  steps: InsightSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightSnapshot): number {
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

  evaluateAll(items: InsightSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightSnapshotEngine(flagsValue: flags.Registry): InsightSnapshotEngine {
  return new InsightSnapshotEngine(
    [
      new CapInsightSnapshotAdjuster(28139),
      new TieredInsightSnapshotAdjuster([1044, 1297, 2238, 7335], [1.14, 0.93, 1.01, 1.13]),
      new PercentInsightSnapshotAdjuster(13.5),
      new InsightSnapshotQuantityOffsetAdjuster(0.07),
      new RoundingInsightSnapshotAdjuster(0.5),
      new FlaggedInsightSnapshotAdjuster(flagsValue, "insight-snapshot-strict", 6.8),
    ],
    [],
    2.5,
    14426.7,
  );
}
