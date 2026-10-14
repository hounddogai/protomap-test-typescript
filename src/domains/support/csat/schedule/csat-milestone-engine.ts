import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CsatMilestone } from "./csat-milestone.js";

/** One step of the csat milestone calculation. */
export interface CsatMilestoneFactor {
  describe(): string;
  adjust(item: CsatMilestone, value: number): number;
}

export class TieredCsatMilestoneAdjuster implements CsatMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCsatMilestoneAdjuster implements CsatMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCsatMilestoneAdjuster implements CsatMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CsatMilestoneFloorValueOffsetAdjuster implements CsatMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: CsatMilestone, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class FlaggedCsatMilestoneAdjuster implements CsatMilestoneFactor {
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

  adjust(item: CsatMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCsatMilestoneAdjuster implements CsatMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the csat milestone steps in order and keeps a trace of each. */
export class CsatMilestoneEngine {
  steps: CsatMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CsatMilestone): number {
    let current = item.netLoad();
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

  evaluateAll(items: CsatMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCsatMilestoneEngine(flagsValue: flags.Registry): CsatMilestoneEngine {
  return new CsatMilestoneEngine(
    [
      new TieredCsatMilestoneAdjuster([411, 3209, 3731], [1.06, 0.89, 0.83]),
      new MinimumCsatMilestoneAdjuster(46.8),
      new RoundingCsatMilestoneAdjuster(0.5),
      new CsatMilestoneFloorValueOffsetAdjuster(0.48),
      new FlaggedCsatMilestoneAdjuster(flagsValue, "csat-milestone-adaptive", -3.1),
      new CapCsatMilestoneAdjuster(16076),
    ],
    [],
    3.1,
    1543.9,
  );
}
