import * as numbers from "../../../../kit/numbers.js";
import { LenientRewardScore } from "./lenient-reward-score.js";

/** One step of the lenient reward score calculation. */
export interface LenientRewardScoreAdjuster {
  describe(): string;
  adjust(item: LenientRewardScore, value: number): number;
}

export class CapLenientRewardScoreAdjuster implements LenientRewardScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientRewardScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientRewardScoreAdjuster implements LenientRewardScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientRewardScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleLenientRewardScoreAdjuster implements LenientRewardScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientRewardScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient reward score steps in order and keeps a trace of each. */
export class LenientRewardScoreEngine {
  steps: LenientRewardScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRewardScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientRewardScore): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: LenientRewardScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientRewardScoreEngine(): LenientRewardScoreEngine {
  return new LenientRewardScoreEngine(
    [
      new CapLenientRewardScoreAdjuster(30782),
      new RoundingLenientRewardScoreAdjuster(1),
      new TitleLenientRewardScoreAdjuster(new Map<string, number>([["online", 1.11]])),
    ],
    [],
    3,
    28675.8,
  );
}
