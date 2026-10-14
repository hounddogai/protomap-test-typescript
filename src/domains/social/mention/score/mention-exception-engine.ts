import * as numbers from "../../../../kit/numbers.js";
import { MentionException } from "./mention-exception.js";

/** One step of the mention exception calculation. */
export interface MentionExceptionFactor {
  describe(): string;
  adjust(item: MentionException, value: number): number;
}

export class TieredMentionExceptionAdjuster implements MentionExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingMentionExceptionAdjuster implements MentionExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentMentionExceptionAdjuster implements MentionExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapMentionExceptionAdjuster implements MentionExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MentionExceptionBudgetOffsetAdjuster implements MentionExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: MentionException, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TitleMentionExceptionAdjuster implements MentionExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: MentionException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the mention exception steps in order and keeps a trace of each. */
export class MentionExceptionEngine {
  steps: MentionExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionException): number {
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

  evaluateAll(items: MentionException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionExceptionEngine(): MentionExceptionEngine {
  return new MentionExceptionEngine(
    [
      new TieredMentionExceptionAdjuster([2359, 7435, 9161, 9626], [0.98, 0.95, 1.13, 0.94]),
      new RoundingMentionExceptionAdjuster(0.1),
      new PercentMentionExceptionAdjuster(22.9),
      new CapMentionExceptionAdjuster(44744),
      new MentionExceptionBudgetOffsetAdjuster(0.74),
      new TitleMentionExceptionAdjuster(
        new Map<string, number>([["south", 0.81], ["west", 1.02], ["central", 0.95]]),
      ),
    ],
    [],
    2.3,
    28356.3,
  );
}
