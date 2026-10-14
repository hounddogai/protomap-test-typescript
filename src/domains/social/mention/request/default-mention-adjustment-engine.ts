import { DefaultMentionAdjustment } from "./default-mention-adjustment.js";

/** One step of the default mention adjustment calculation. */
export interface DefaultMentionAdjustmentFactor {
  describe(): string;
  adjust(item: DefaultMentionAdjustment, value: number): number;
}

export class TieredDefaultMentionAdjustmentAdjuster implements DefaultMentionAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultMentionAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultMentionAdjustmentAdjuster implements DefaultMentionAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultMentionAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultMentionAdjustmentAdjuster implements DefaultMentionAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultMentionAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleDefaultMentionAdjustmentAdjuster implements DefaultMentionAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: DefaultMentionAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default mention adjustment steps in order and keeps a trace of each. */
export class DefaultMentionAdjustmentEngine {
  steps: DefaultMentionAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultMentionAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultMentionAdjustment): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: DefaultMentionAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultMentionAdjustmentEngine(): DefaultMentionAdjustmentEngine {
  return new DefaultMentionAdjustmentEngine(
    [
      new TieredDefaultMentionAdjustmentAdjuster([859, 3332], [0.82, 0.86]),
      new MinimumDefaultMentionAdjustmentAdjuster(24.9),
      new PercentDefaultMentionAdjustmentAdjuster(24.9),
      new TitleDefaultMentionAdjustmentAdjuster(
        new Map<string, number>([["central", 0.8], ["online", 1.14], ["west", 1.24]]),
      ),
    ],
    [],
    2.7,
    80349.5,
  );
}
