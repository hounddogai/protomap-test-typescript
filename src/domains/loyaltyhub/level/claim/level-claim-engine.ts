import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelClaim } from "./level-claim.js";

/** One step of the level claim calculation. */
export interface LevelClaimStep {
  describe(): string;
  adjust(item: LevelClaim, value: number): number;
}

export class TieredLevelClaimAdjuster implements LevelClaimStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLevelClaimAdjuster implements LevelClaimStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleLevelClaimAdjuster implements LevelClaimStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LevelClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLevelClaimAdjuster implements LevelClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLevelClaimAdjuster implements LevelClaimStep {
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

  adjust(item: LevelClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLevelClaimAdjuster implements LevelClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the level claim steps in order and keeps a trace of each. */
export class LevelClaimEngine {
  steps: LevelClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LevelClaim): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: LevelClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLevelClaimEngine(flagsValue: flags.Registry): LevelClaimEngine {
  return new LevelClaimEngine(
    [
      new TieredLevelClaimAdjuster([1430, 3038, 8618, 8710], [1.01, 0.9, 0.91, 1.07]),
      new MinimumLevelClaimAdjuster(49.2),
      new TitleLevelClaimAdjuster(new Map<string, number>([["east", 0.9]])),
      new RoundingLevelClaimAdjuster(1),
      new FlaggedLevelClaimAdjuster(flagsValue, "level-claim-seasonal", -2.9),
      new CapLevelClaimAdjuster(37056),
    ],
    [],
    1,
    19342.8,
  );
}
