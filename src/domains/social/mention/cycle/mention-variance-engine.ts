import { MentionVariance } from "./mention-variance.js";

/** One step of the mention variance calculation. */
export interface MentionVarianceModifier {
  describe(): string;
  adjust(item: MentionVariance, value: number): number;
}

export class CapMentionVarianceAdjuster implements MentionVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumMentionVarianceAdjuster implements MentionVarianceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class MentionVarianceRateOffsetAdjuster implements MentionVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: MentionVariance, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class ChannelMentionVarianceAdjuster implements MentionVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: MentionVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the mention variance steps in order and keeps a trace of each. */
export class MentionVarianceEngine {
  steps: MentionVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MentionVariance): number {
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

  evaluateAll(items: MentionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMentionVarianceEngine(): MentionVarianceEngine {
  return new MentionVarianceEngine(
    [
      new CapMentionVarianceAdjuster(21996),
      new MinimumMentionVarianceAdjuster(12.4),
      new MentionVarianceRateOffsetAdjuster(0.33),
      new ChannelMentionVarianceAdjuster(new Map<string, number>([["online", 1.05]])),
    ],
    [],
    4,
    54293.2,
  );
}
