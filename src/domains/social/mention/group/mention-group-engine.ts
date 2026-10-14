import * as numbers from "../../../../kit/numbers.js";
import { MentionGroup } from "./mention-group.js";

/** One step of the mention group calculation. */
export interface MentionGroupModifier {
  describe(): string;
  adjust(item: MentionGroup, value: number): number;
}

export class MinimumMentionGroupAdjuster implements MentionGroupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class MentionGroupBidOffsetAdjuster implements MentionGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: MentionGroup, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class RoundingMentionGroupAdjuster implements MentionGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentMentionGroupAdjuster implements MentionGroupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleMentionGroupAdjuster implements MentionGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: MentionGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the mention group steps in order and keeps a trace of each. */
export class MentionGroupEngine {
  steps: MentionGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: MentionGroup): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: MentionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultMentionGroupEngine(): MentionGroupEngine {
  return new MentionGroupEngine(
    [
      new MinimumMentionGroupAdjuster(31.7),
      new MentionGroupBidOffsetAdjuster(0.87),
      new RoundingMentionGroupAdjuster(5),
      new PercentMentionGroupAdjuster(-18.2),
      new LocaleMentionGroupAdjuster(new Map<string, number>([["online", 1.22], ["west", 0.82]])),
    ],
    [],
    3.8,
    56658.4,
  );
}
