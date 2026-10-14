import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientBounceScore } from "./lenient-bounce-score.js";

/** One step of the lenient bounce score calculation. */
export interface LenientBounceScoreModifier {
  describe(): string;
  adjust(item: LenientBounceScore, value: number): number;
}

export class PercentLenientBounceScoreAdjuster implements LenientBounceScoreModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientBounceScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientBounceScoreAdjuster implements LenientBounceScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientBounceScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLenientBounceScoreAdjuster implements LenientBounceScoreModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientBounceScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientBounceScoreAdjuster implements LenientBounceScoreModifier {
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

  adjust(item: LenientBounceScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientBounceScoreAdjuster implements LenientBounceScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientBounceScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient bounce score steps in order and keeps a trace of each. */
export class LenientBounceScoreEngine {
  steps: LenientBounceScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientBounceScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientBounceScore): number {
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

  evaluateAll(items: LenientBounceScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientBounceScoreEngine(flagsValue: flags.Registry): LenientBounceScoreEngine {
  return new LenientBounceScoreEngine(
    [
      new PercentLenientBounceScoreAdjuster(-13.4),
      new TieredLenientBounceScoreAdjuster([2495, 3547, 7370, 7545], [1.19, 0.88, 0.86, 1.2]),
      new MinimumLenientBounceScoreAdjuster(1.7),
      new FlaggedLenientBounceScoreAdjuster(flagsValue, "lenient-bounce-score-regional", 6.9),
      new RoundingLenientBounceScoreAdjuster(1),
    ],
    [],
    2.4,
    20311.2,
  );
}
