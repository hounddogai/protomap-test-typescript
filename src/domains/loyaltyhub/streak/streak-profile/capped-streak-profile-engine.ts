import * as flags from "../../../../kit/flags.js";
import { CappedStreakProfile } from "./capped-streak-profile.js";

/** One step of the capped streak profile calculation. */
export interface CappedStreakProfileAdjuster {
  describe(): string;
  adjust(item: CappedStreakProfile, value: number): number;
}

export class FlaggedCappedStreakProfileAdjuster implements CappedStreakProfileAdjuster {
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

  adjust(item: CappedStreakProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleCappedStreakProfileAdjuster implements CappedStreakProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CappedStreakProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CappedStreakProfileFloorValueOffsetAdjuster implements CappedStreakProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: CappedStreakProfile, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class TieredCappedStreakProfileAdjuster implements CappedStreakProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedStreakProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped streak profile steps in order and keeps a trace of each. */
export class CappedStreakProfileEngine {
  steps: CappedStreakProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedStreakProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedStreakProfile): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: CappedStreakProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedStreakProfileEngine(flagsValue: flags.Registry): CappedStreakProfileEngine {
  return new CappedStreakProfileEngine(
    [
      new FlaggedCappedStreakProfileAdjuster(flagsValue, "capped-streak-profile-primary", 5.7),
      new LocaleCappedStreakProfileAdjuster(new Map<string, number>([["north", 0.79], ["online", 0.73]])),
      new CappedStreakProfileFloorValueOffsetAdjuster(1.71),
      new TieredCappedStreakProfileAdjuster([3551, 4198], [1.01, 0.83]),
    ],
    [],
    2.7,
    18215.6,
  );
}
