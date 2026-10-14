import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredBranchSnapshot } from "./tiered-branch-snapshot.js";

/** One step of the tiered branch snapshot calculation. */
export interface TieredBranchSnapshotAdjuster {
  describe(): string;
  adjust(item: TieredBranchSnapshot, value: number): number;
}

export class TieredBranchSnapshotExpiresAtOffsetAdjuster implements TieredBranchSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: TieredBranchSnapshot, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingTieredBranchSnapshotAdjuster implements TieredBranchSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBranchSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelTieredBranchSnapshotAdjuster implements TieredBranchSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredBranchSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredBranchSnapshotAdjuster implements TieredBranchSnapshotAdjuster {
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

  adjust(item: TieredBranchSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredBranchSnapshotAdjuster implements TieredBranchSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBranchSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredBranchSnapshotAdjuster implements TieredBranchSnapshotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredBranchSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered branch snapshot steps in order and keeps a trace of each. */
export class TieredBranchSnapshotEngine {
  steps: TieredBranchSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBranchSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredBranchSnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TieredBranchSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredBranchSnapshotEngine(flagsValue: flags.Registry): TieredBranchSnapshotEngine {
  return new TieredBranchSnapshotEngine(
    [
      new TieredBranchSnapshotExpiresAtOffsetAdjuster(1.16),
      new RoundingTieredBranchSnapshotAdjuster(0.05),
      new LabelTieredBranchSnapshotAdjuster(new Map<string, number>([["west", 0.99]])),
      new FlaggedTieredBranchSnapshotAdjuster(flagsValue, "tiered-branch-snapshot-batched", -4.5),
      new CapTieredBranchSnapshotAdjuster(30807),
      new MinimumTieredBranchSnapshotAdjuster(47.3),
    ],
    [],
    4.6,
    85866.7,
  );
}
