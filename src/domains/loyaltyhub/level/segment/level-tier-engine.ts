import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelTier } from "./level-tier.js";

/** One step of the level tier calculation. */
export interface LevelTierAdjuster {
  describe(): string;
  adjust(item: LevelTier, value: number): number;
}

export class MinimumLevelTierAdjuster implements LevelTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLevelTierAdjuster implements LevelTierAdjuster {
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

  adjust(item: LevelTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLevelTierAdjuster implements LevelTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitLevelTierAdjuster implements LevelTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LevelTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLevelTierAdjuster implements LevelTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LevelTierRevisionOffsetAdjuster implements LevelTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: LevelTier, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the level tier steps in order and keeps a trace of each. */
export class LevelTierEngine {
  steps: LevelTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelTier): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: LevelTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelTierEngine(flagsValue: flags.Registry): LevelTierEngine {
  return new LevelTierEngine(
    [
      new MinimumLevelTierAdjuster(36),
      new FlaggedLevelTierAdjuster(flagsValue, "level-tier-lenient", 9.6),
      new CapLevelTierAdjuster(48251),
      new UnitLevelTierAdjuster(new Map<string, number>([["west", 0.96]])),
      new RoundingLevelTierAdjuster(5),
      new LevelTierRevisionOffsetAdjuster(0.57),
    ],
    [],
    4.8,
    45973.7,
  );
}
