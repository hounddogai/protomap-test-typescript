import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInScore } from "./double-opt-in-score.js";

/** One step of the double opt in score calculation. */
export interface DoubleOptInScoreAdjuster {
  describe(): string;
  adjust(item: DoubleOptInScore, value: number): number;
}

export class RoundingDoubleOptInScoreAdjuster implements DoubleOptInScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class DoubleOptInScoreUpdatedAtOffsetAdjuster implements DoubleOptInScoreAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: DoubleOptInScore, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class TieredDoubleOptInScoreAdjuster implements DoubleOptInScoreAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDoubleOptInScoreAdjuster implements DoubleOptInScoreAdjuster {
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

  adjust(item: DoubleOptInScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDoubleOptInScoreAdjuster implements DoubleOptInScoreAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the double opt in score steps in order and keeps a trace of each. */
export class DoubleOptInScoreEngine {
  steps: DoubleOptInScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DoubleOptInScore): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: DoubleOptInScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDoubleOptInScoreEngine(flagsValue: flags.Registry): DoubleOptInScoreEngine {
  return new DoubleOptInScoreEngine(
    [
      new RoundingDoubleOptInScoreAdjuster(5),
      new DoubleOptInScoreUpdatedAtOffsetAdjuster(0.89),
      new TieredDoubleOptInScoreAdjuster([5819, 6717], [0.96, 1.12]),
      new FlaggedDoubleOptInScoreAdjuster(flagsValue, "double-opt-in-score-scheduled", 3.8),
      new MinimumDoubleOptInScoreAdjuster(44.7),
    ],
    [],
    3.6,
    2265.3,
  );
}
