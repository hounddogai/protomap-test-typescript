import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredWarmupCycle } from "./tiered-warmup-cycle.js";

/** One step of the tiered warmup cycle calculation. */
export interface TieredWarmupCycleAdjuster {
  describe(): string;
  adjust(item: TieredWarmupCycle, value: number): number;
}

export class FlaggedTieredWarmupCycleAdjuster implements TieredWarmupCycleAdjuster {
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

  adjust(item: TieredWarmupCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredWarmupCycleAdjuster implements TieredWarmupCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredWarmupCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredWarmupCycleAdjuster implements TieredWarmupCycleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredWarmupCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleTieredWarmupCycleAdjuster implements TieredWarmupCycleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TieredWarmupCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWarmupCycleScoreOffsetAdjuster implements TieredWarmupCycleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: TieredWarmupCycle, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentTieredWarmupCycleAdjuster implements TieredWarmupCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredWarmupCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered warmup cycle steps in order and keeps a trace of each. */
export class TieredWarmupCycleEngine {
  steps: TieredWarmupCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWarmupCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredWarmupCycle): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: TieredWarmupCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredWarmupCycleEngine(flagsValue: flags.Registry): TieredWarmupCycleEngine {
  return new TieredWarmupCycleEngine(
    [
      new FlaggedTieredWarmupCycleAdjuster(flagsValue, "tiered-warmup-cycle-manual", 2.1),
      new CapTieredWarmupCycleAdjuster(16083),
      new MinimumTieredWarmupCycleAdjuster(14.4),
      new LocaleTieredWarmupCycleAdjuster(
        new Map<string, number>([["central", 0.9], ["online", 1.35], ["west", 0.86]]),
      ),
      new TieredWarmupCycleScoreOffsetAdjuster(1.78),
      new PercentTieredWarmupCycleAdjuster(-24.5),
    ],
    [],
    3.9,
    60772.1,
  );
}
