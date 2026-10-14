import * as flags from "../../../../kit/flags.js";
import { LegacyPathMilestone } from "./legacy-path-milestone.js";

/** One step of the legacy path milestone calculation. */
export interface LegacyPathMilestoneFactor {
  describe(): string;
  adjust(item: LegacyPathMilestone, value: number): number;
}

export class CapLegacyPathMilestoneAdjuster implements LegacyPathMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPathMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLegacyPathMilestoneAdjuster implements LegacyPathMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPathMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionLegacyPathMilestoneAdjuster implements LegacyPathMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LegacyPathMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LegacyPathMilestoneRevisionOffsetAdjuster implements LegacyPathMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: LegacyPathMilestone, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedLegacyPathMilestoneAdjuster implements LegacyPathMilestoneFactor {
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

  adjust(item: LegacyPathMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy path milestone steps in order and keeps a trace of each. */
export class LegacyPathMilestoneEngine {
  steps: LegacyPathMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPathMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyPathMilestone): number {
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

  evaluateAll(items: LegacyPathMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyPathMilestoneEngine(flagsValue: flags.Registry): LegacyPathMilestoneEngine {
  return new LegacyPathMilestoneEngine(
    [
      new CapLegacyPathMilestoneAdjuster(17965),
      new MinimumLegacyPathMilestoneAdjuster(8.7),
      new RegionLegacyPathMilestoneAdjuster(new Map<string, number>([["east", 0.91]])),
      new LegacyPathMilestoneRevisionOffsetAdjuster(0.52),
      new FlaggedLegacyPathMilestoneAdjuster(flagsValue, "legacy-path-milestone-tiered", 7),
    ],
    [],
    4.2,
    20527.2,
  );
}
