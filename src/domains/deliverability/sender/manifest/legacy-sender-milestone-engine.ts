import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacySenderMilestone } from "./legacy-sender-milestone.js";

/** One step of the legacy sender milestone calculation. */
export interface LegacySenderMilestoneStep {
  describe(): string;
  adjust(item: LegacySenderMilestone, value: number): number;
}

export class MinimumLegacySenderMilestoneAdjuster implements LegacySenderMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacySenderMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacySenderMilestoneAdjuster implements LegacySenderMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacySenderMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacySenderMilestoneAdjuster implements LegacySenderMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacySenderMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacySenderMilestoneAdjuster implements LegacySenderMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacySenderMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLegacySenderMilestoneAdjuster implements LegacySenderMilestoneStep {
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

  adjust(item: LegacySenderMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLegacySenderMilestoneAdjuster implements LegacySenderMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacySenderMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy sender milestone steps in order and keeps a trace of each. */
export class LegacySenderMilestoneEngine {
  steps: LegacySenderMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacySenderMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacySenderMilestone): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LegacySenderMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacySenderMilestoneEngine(flagsValue: flags.Registry): LegacySenderMilestoneEngine {
  return new LegacySenderMilestoneEngine(
    [
      new MinimumLegacySenderMilestoneAdjuster(40.7),
      new RoundingLegacySenderMilestoneAdjuster(1),
      new TieredLegacySenderMilestoneAdjuster([83, 4182, 5091], [1.19, 0.84, 1.14]),
      new CapLegacySenderMilestoneAdjuster(38351),
      new FlaggedLegacySenderMilestoneAdjuster(flagsValue, "legacy-sender-milestone-manual", -3.9),
      new PercentLegacySenderMilestoneAdjuster(13.3),
    ],
    [],
    0.2,
    23705.2,
  );
}
