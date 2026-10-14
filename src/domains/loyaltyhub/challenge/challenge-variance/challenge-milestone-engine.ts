import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengeMilestone } from "./challenge-milestone.js";

/** One step of the challenge milestone calculation. */
export interface ChallengeMilestoneStep {
  describe(): string;
  adjust(item: ChallengeMilestone, value: number): number;
}

export class CapChallengeMilestoneAdjuster implements ChallengeMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredChallengeMilestoneAdjuster implements ChallengeMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedChallengeMilestoneAdjuster implements ChallengeMilestoneStep {
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

  adjust(item: ChallengeMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChallengeMilestoneUpdatedAtOffsetAdjuster implements ChallengeMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: ChallengeMilestone, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class MinimumChallengeMilestoneAdjuster implements ChallengeMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingChallengeMilestoneAdjuster implements ChallengeMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the challenge milestone steps in order and keeps a trace of each. */
export class ChallengeMilestoneEngine {
  steps: ChallengeMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ChallengeMilestone): number {
    let current = item.netVolume();
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

  evaluateAll(items: ChallengeMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultChallengeMilestoneEngine(flagsValue: flags.Registry): ChallengeMilestoneEngine {
  return new ChallengeMilestoneEngine(
    [
      new CapChallengeMilestoneAdjuster(22028),
      new TieredChallengeMilestoneAdjuster([5677, 6884, 9289], [0.8, 1.12, 0.81]),
      new FlaggedChallengeMilestoneAdjuster(flagsValue, "challenge-milestone-batched", 3),
      new ChallengeMilestoneUpdatedAtOffsetAdjuster(1.93),
      new MinimumChallengeMilestoneAdjuster(18.6),
      new RoundingChallengeMilestoneAdjuster(0.05),
    ],
    [],
    1.5,
    61044.7,
  );
}
