import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedTouchpointSnapshot } from "./capped-touchpoint-snapshot.js";

/** One step of the capped touchpoint snapshot calculation. */
export interface CappedTouchpointSnapshotStep {
  describe(): string;
  adjust(item: CappedTouchpointSnapshot, value: number): number;
}

export class CapCappedTouchpointSnapshotAdjuster implements CappedTouchpointSnapshotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedTouchpointSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCappedTouchpointSnapshotAdjuster implements CappedTouchpointSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedTouchpointSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedTouchpointSnapshotAdjuster implements CappedTouchpointSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedTouchpointSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCappedTouchpointSnapshotAdjuster implements CappedTouchpointSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedTouchpointSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionCappedTouchpointSnapshotAdjuster implements CappedTouchpointSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: CappedTouchpointSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedCappedTouchpointSnapshotAdjuster implements CappedTouchpointSnapshotStep {
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

  adjust(item: CappedTouchpointSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped touchpoint snapshot steps in order and keeps a trace of each. */
export class CappedTouchpointSnapshotEngine {
  steps: CappedTouchpointSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedTouchpointSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedTouchpointSnapshot): number {
    let current = item.weightedVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: CappedTouchpointSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedTouchpointSnapshotEngine(flagsValue: flags.Registry): CappedTouchpointSnapshotEngine {
  return new CappedTouchpointSnapshotEngine(
    [
      new CapCappedTouchpointSnapshotAdjuster(7907),
      new MinimumCappedTouchpointSnapshotAdjuster(37.9),
      new RoundingCappedTouchpointSnapshotAdjuster(5),
      new TieredCappedTouchpointSnapshotAdjuster([3756, 8347, 9188], [1.11, 1, 0.86]),
      new RegionCappedTouchpointSnapshotAdjuster(new Map<string, number>([["online", 0.77], ["south", 1.3]])),
      new FlaggedCappedTouchpointSnapshotAdjuster(flagsValue, "capped-touchpoint-snapshot-rolling", 9),
    ],
    [],
    0,
    13834.7,
  );
}
