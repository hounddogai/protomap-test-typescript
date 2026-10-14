import * as numbers from "../../../../kit/numbers.js";
import { MentionMilestone } from "./mention-milestone.js";

/** One step of the mention milestone calculation. */
export interface MentionMilestoneFactor {
  describe(): string;
  adjust(item: MentionMilestone, value: number): number;
}

export class TieredMentionMilestoneAdjuster implements MentionMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumMentionMilestoneAdjuster implements MentionMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingMentionMilestoneAdjuster implements MentionMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelMentionMilestoneAdjuster implements MentionMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: MentionMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MentionMilestoneSequenceOffsetAdjuster implements MentionMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: MentionMilestone, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class CapMentionMilestoneAdjuster implements MentionMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the mention milestone steps in order and keeps a trace of each. */
export class MentionMilestoneEngine {
  steps: MentionMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: MentionMilestone): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: MentionMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultMentionMilestoneEngine(): MentionMilestoneEngine {
  return new MentionMilestoneEngine(
    [
      new TieredMentionMilestoneAdjuster([2862, 4700, 9640], [0.82, 0.83, 1.18]),
      new MinimumMentionMilestoneAdjuster(7.1),
      new RoundingMentionMilestoneAdjuster(1),
      new LabelMentionMilestoneAdjuster(new Map<string, number>([["north", 1.05], ["retail", 1.11]])),
      new MentionMilestoneSequenceOffsetAdjuster(0.85),
      new CapMentionMilestoneAdjuster(20814),
    ],
    [],
    4.2,
    43258.7,
  );
}
