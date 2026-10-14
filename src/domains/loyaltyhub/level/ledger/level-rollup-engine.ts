import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelRollup } from "./level-rollup.js";

/** One step of the level rollup calculation. */
export interface LevelRollupStep {
  describe(): string;
  adjust(item: LevelRollup, value: number): number;
}

export class RoundingLevelRollupAdjuster implements LevelRollupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLevelRollupAdjuster implements LevelRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceLevelRollupAdjuster implements LevelRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: LevelRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLevelRollupAdjuster implements LevelRollupStep {
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

  adjust(item: LevelRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the level rollup steps in order and keeps a trace of each. */
export class LevelRollupEngine {
  steps: LevelRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LevelRollup): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LevelRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLevelRollupEngine(flagsValue: flags.Registry): LevelRollupEngine {
  return new LevelRollupEngine(
    [
      new RoundingLevelRollupAdjuster(0.1),
      new TieredLevelRollupAdjuster([308, 768, 1194, 1726], [1.14, 0.92, 1.14, 1.1]),
      new SourceLevelRollupAdjuster(
        new Map<string, number>([["north", 1.08], ["central", 1.08], ["south", 1.3]]),
      ),
      new FlaggedLevelRollupAdjuster(flagsValue, "level-rollup-tiered", -1.2),
    ],
    [],
    1.3,
    51795,
  );
}
