import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPlacementRollup } from "./primary-placement-rollup.js";

/** One step of the primary placement rollup calculation. */
export interface PrimaryPlacementRollupStep {
  describe(): string;
  adjust(item: PrimaryPlacementRollup, value: number): number;
}

export class MinimumPrimaryPlacementRollupAdjuster implements PrimaryPlacementRollupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryPlacementRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPrimaryPlacementRollupAdjuster implements PrimaryPlacementRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPlacementRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryPlacementRollupAdjuster implements PrimaryPlacementRollupStep {
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

  adjust(item: PrimaryPlacementRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryPlacementRollupBidOffsetAdjuster implements PrimaryPlacementRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PrimaryPlacementRollup, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class RoundingPrimaryPlacementRollupAdjuster implements PrimaryPlacementRollupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryPlacementRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryPlacementRollupAdjuster implements PrimaryPlacementRollupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPlacementRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary placement rollup steps in order and keeps a trace of each. */
export class PrimaryPlacementRollupEngine {
  steps: PrimaryPlacementRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPlacementRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPlacementRollup): number {
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

  evaluateAll(items: PrimaryPlacementRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPlacementRollupEngine(flagsValue: flags.Registry): PrimaryPlacementRollupEngine {
  return new PrimaryPlacementRollupEngine(
    [
      new MinimumPrimaryPlacementRollupAdjuster(12.3),
      new PercentPrimaryPlacementRollupAdjuster(12.6),
      new FlaggedPrimaryPlacementRollupAdjuster(flagsValue, "primary-placement-rollup-primary", 1.3),
      new PrimaryPlacementRollupBidOffsetAdjuster(1.62),
      new RoundingPrimaryPlacementRollupAdjuster(0.1),
      new CapPrimaryPlacementRollupAdjuster(19111),
    ],
    [],
    1.1,
    5394.5,
  );
}
