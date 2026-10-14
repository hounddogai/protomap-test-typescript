import * as flags from "../../../../kit/flags.js";
import { DefaultPostScore } from "./default-post-score.js";

/** One step of the default post score calculation. */
export interface DefaultPostScoreFactor {
  describe(): string;
  adjust(item: DefaultPostScore, value: number): number;
}

export class FlaggedDefaultPostScoreAdjuster implements DefaultPostScoreFactor {
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

  adjust(item: DefaultPostScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultPostScoreAdjuster implements DefaultPostScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultPostScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameDefaultPostScoreAdjuster implements DefaultPostScoreFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultPostScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DefaultPostScoreMinimumOffsetAdjuster implements DefaultPostScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: DefaultPostScore, value: number): number {
    return value + item.minimum * this.weight;
  }
}

/** Runs the default post score steps in order and keeps a trace of each. */
export class DefaultPostScoreEngine {
  steps: DefaultPostScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPostScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultPostScore): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: DefaultPostScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultPostScoreEngine(flagsValue: flags.Registry): DefaultPostScoreEngine {
  return new DefaultPostScoreEngine(
    [
      new FlaggedDefaultPostScoreAdjuster(flagsValue, "default-post-score-weighted", 6.2),
      new MinimumDefaultPostScoreAdjuster(7.7),
      new NameDefaultPostScoreAdjuster(new Map<string, number>([["online", 1.36]])),
      new DefaultPostScoreMinimumOffsetAdjuster(1.68),
    ],
    [],
    0.5,
    72857.3,
  );
}
