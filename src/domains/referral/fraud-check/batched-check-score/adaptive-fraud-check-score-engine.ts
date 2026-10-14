import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

/** One step of the adaptive fraud check score calculation. */
export interface AdaptiveFraudCheckScoreFactor {
  describe(): string;
  adjust(item: AdaptiveFraudCheckScore, value: number): number;
}

export class MinimumAdaptiveFraudCheckScoreAdjuster implements AdaptiveFraudCheckScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveFraudCheckScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptiveFraudCheckScoreAdjuster implements AdaptiveFraudCheckScoreFactor {
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

  adjust(item: AdaptiveFraudCheckScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveFraudCheckScoreAdjuster implements AdaptiveFraudCheckScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveFraudCheckScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionAdaptiveFraudCheckScoreAdjuster implements AdaptiveFraudCheckScoreFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: AdaptiveFraudCheckScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive fraud check score steps in order and keeps a trace of each. */
export class AdaptiveFraudCheckScoreEngine {
  steps: AdaptiveFraudCheckScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveFraudCheckScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveFraudCheckScore): number {
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

  evaluateAll(items: AdaptiveFraudCheckScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveFraudCheckScoreEngine(flagsValue: flags.Registry): AdaptiveFraudCheckScoreEngine {
  return new AdaptiveFraudCheckScoreEngine(
    [
      new MinimumAdaptiveFraudCheckScoreAdjuster(20.7),
      new FlaggedAdaptiveFraudCheckScoreAdjuster(flagsValue, "adaptive-fraud-check-score-legacy", 4.7),
      new RoundingAdaptiveFraudCheckScoreAdjuster(5),
      new RegionAdaptiveFraudCheckScoreAdjuster(new Map<string, number>([["retail", 1.29], ["east", 1.22]])),
    ],
    [],
    3.4,
    13262.3,
  );
}
