import * as numbers from "../../../../kit/numbers.js";
import { LegacyMentionMilestone } from "./legacy-mention-milestone.js";

/** One step of the legacy mention milestone calculation. */
export interface LegacyMentionMilestoneStep {
  describe(): string;
  adjust(item: LegacyMentionMilestone, value: number): number;
}

export class LabelLegacyMentionMilestoneAdjuster implements LegacyMentionMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LegacyMentionMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLegacyMentionMilestoneAdjuster implements LegacyMentionMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyMentionMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyMentionMilestoneAdjuster implements LegacyMentionMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyMentionMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LegacyMentionMilestoneBatchSizeOffsetAdjuster implements LegacyMentionMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: LegacyMentionMilestone, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the legacy mention milestone steps in order and keeps a trace of each. */
export class LegacyMentionMilestoneEngine {
  steps: LegacyMentionMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyMentionMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyMentionMilestone): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LegacyMentionMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyMentionMilestoneEngine(): LegacyMentionMilestoneEngine {
  return new LegacyMentionMilestoneEngine(
    [
      new LabelLegacyMentionMilestoneAdjuster(new Map<string, number>([["north", 1.01], ["west", 1.32]])),
      new RoundingLegacyMentionMilestoneAdjuster(0.5),
      new TieredLegacyMentionMilestoneAdjuster([1120, 1695], [1.04, 1.1]),
      new LegacyMentionMilestoneBatchSizeOffsetAdjuster(1.73),
    ],
    [],
    2.2,
    5450.3,
  );
}
