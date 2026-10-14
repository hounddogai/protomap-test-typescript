import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultSenderScore } from "./default-sender-score.js";

/** One step of the default sender score calculation. */
export interface DefaultSenderScoreStep {
  describe(): string;
  adjust(item: DefaultSenderScore, value: number): number;
}

export class TitleDefaultSenderScoreAdjuster implements DefaultSenderScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: DefaultSenderScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDefaultSenderScoreAdjuster implements DefaultSenderScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultSenderScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultSenderScoreAdjuster implements DefaultSenderScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultSenderScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDefaultSenderScoreAdjuster implements DefaultSenderScoreStep {
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

  adjust(item: DefaultSenderScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DefaultSenderScoreClicksOffsetAdjuster implements DefaultSenderScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: DefaultSenderScore, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the default sender score steps in order and keeps a trace of each. */
export class DefaultSenderScoreEngine {
  steps: DefaultSenderScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSenderScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultSenderScore): number {
    let current = item.netVolume();
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

  evaluateAll(items: DefaultSenderScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultSenderScoreEngine(flagsValue: flags.Registry): DefaultSenderScoreEngine {
  return new DefaultSenderScoreEngine(
    [
      new TitleDefaultSenderScoreAdjuster(new Map<string, number>([["east", 1.24], ["online", 1.21]])),
      new TieredDefaultSenderScoreAdjuster([1062, 4237, 8444], [0.89, 1.18, 0.83]),
      new MinimumDefaultSenderScoreAdjuster(45.1),
      new FlaggedDefaultSenderScoreAdjuster(flagsValue, "default-sender-score-manual", -3.6),
      new DefaultSenderScoreClicksOffsetAdjuster(1.45),
    ],
    [],
    3.9,
    25346,
  );
}
