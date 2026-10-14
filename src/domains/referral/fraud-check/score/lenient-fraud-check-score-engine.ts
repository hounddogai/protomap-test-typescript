import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientFraudCheckScore } from "./lenient-fraud-check-score.js";

/** One step of the lenient fraud check score calculation. */
export interface LenientFraudCheckScoreFactor {
  describe(): string;
  adjust(item: LenientFraudCheckScore, value: number): number;
}

export class RoundingLenientFraudCheckScoreAdjuster implements LenientFraudCheckScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientFraudCheckScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLenientFraudCheckScoreAdjuster implements LenientFraudCheckScoreFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientFraudCheckScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLenientFraudCheckScoreAdjuster implements LenientFraudCheckScoreFactor {
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

  adjust(item: LenientFraudCheckScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient fraud check score steps in order and keeps a trace of each. */
export class LenientFraudCheckScoreEngine {
  steps: LenientFraudCheckScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFraudCheckScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientFraudCheckScore): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LenientFraudCheckScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientFraudCheckScoreEngine(flagsValue: flags.Registry): LenientFraudCheckScoreEngine {
  return new LenientFraudCheckScoreEngine(
    [
      new RoundingLenientFraudCheckScoreAdjuster(0.05),
      new TieredLenientFraudCheckScoreAdjuster([1745, 3095], [1.04, 0.95]),
      new FlaggedLenientFraudCheckScoreAdjuster(flagsValue, "lenient-fraud-check-score-batched", 9),
    ],
    [],
    1.7,
    66080.4,
  );
}
