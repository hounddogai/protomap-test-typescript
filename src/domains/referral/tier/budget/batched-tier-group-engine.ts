import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedTierGroup } from "./batched-tier-group.js";

/** One step of the batched tier group calculation. */
export interface BatchedTierGroupModifier {
  describe(): string;
  adjust(item: BatchedTierGroup, value: number): number;
}

export class FlaggedBatchedTierGroupAdjuster implements BatchedTierGroupModifier {
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

  adjust(item: BatchedTierGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedTierGroupAdjuster implements BatchedTierGroupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedTierGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedTierGroupAdjuster implements BatchedTierGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedTierGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedTierGroupAdjuster implements BatchedTierGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedTierGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleBatchedTierGroupAdjuster implements BatchedTierGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedTierGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedTierGroupSendAtOffsetAdjuster implements BatchedTierGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: BatchedTierGroup, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the batched tier group steps in order and keeps a trace of each. */
export class BatchedTierGroupEngine {
  steps: BatchedTierGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedTierGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedTierGroup): number {
    let current = item.weightedValue();
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

  evaluateAll(items: BatchedTierGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedTierGroupEngine(flagsValue: flags.Registry): BatchedTierGroupEngine {
  return new BatchedTierGroupEngine(
    [
      new FlaggedBatchedTierGroupAdjuster(flagsValue, "batched-tier-group-adaptive", 2.1),
      new PercentBatchedTierGroupAdjuster(2.7),
      new RoundingBatchedTierGroupAdjuster(0.1),
      new CapBatchedTierGroupAdjuster(28130),
      new TitleBatchedTierGroupAdjuster(new Map<string, number>([["east", 1.01]])),
      new BatchedTierGroupSendAtOffsetAdjuster(1.54),
    ],
    [],
    3,
    98214.2,
  );
}
