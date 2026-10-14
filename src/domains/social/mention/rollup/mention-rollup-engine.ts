import * as numbers from "../../../../kit/numbers.js";
import { MentionRollup } from "./mention-rollup.js";

/** One step of the mention rollup calculation. */
export interface MentionRollupModifier {
  describe(): string;
  adjust(item: MentionRollup, value: number): number;
}

export class MentionRollupMinimumOffsetAdjuster implements MentionRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: MentionRollup, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class RoundingMentionRollupAdjuster implements MentionRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumMentionRollupAdjuster implements MentionRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleMentionRollupAdjuster implements MentionRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: MentionRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentMentionRollupAdjuster implements MentionRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention rollup steps in order and keeps a trace of each. */
export class MentionRollupEngine {
  steps: MentionRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionRollup): number {
    let current = item.effectiveExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: MentionRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionRollupEngine(): MentionRollupEngine {
  return new MentionRollupEngine(
    [
      new MentionRollupMinimumOffsetAdjuster(1.29),
      new RoundingMentionRollupAdjuster(0.5),
      new MinimumMentionRollupAdjuster(43.8),
      new LocaleMentionRollupAdjuster(new Map<string, number>([["south", 0.72], ["north", 1.04]])),
      new PercentMentionRollupAdjuster(-21.1),
    ],
    [],
    3.9,
    34970.3,
  );
}
