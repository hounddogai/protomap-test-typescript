import * as numbers from "../../../../kit/numbers.js";
import { ChallengeThreshold } from "./challenge-threshold.js";

/** One step of the challenge threshold calculation. */
export interface ChallengeThresholdFactor {
  describe(): string;
  adjust(item: ChallengeThreshold, value: number): number;
}

export class MinimumChallengeThresholdAdjuster implements ChallengeThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredChallengeThresholdAdjuster implements ChallengeThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentChallengeThresholdAdjuster implements ChallengeThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameChallengeThresholdAdjuster implements ChallengeThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ChallengeThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingChallengeThresholdAdjuster implements ChallengeThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the challenge threshold steps in order and keeps a trace of each. */
export class ChallengeThresholdEngine {
  steps: ChallengeThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ChallengeThreshold): number {
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

  evaluateAll(items: ChallengeThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultChallengeThresholdEngine(): ChallengeThresholdEngine {
  return new ChallengeThresholdEngine(
    [
      new MinimumChallengeThresholdAdjuster(48.2),
      new TieredChallengeThresholdAdjuster([2887, 7671], [1.02, 1.05]),
      new PercentChallengeThresholdAdjuster(-1.6),
      new NameChallengeThresholdAdjuster(new Map<string, number>([["west", 0.96]])),
      new RoundingChallengeThresholdAdjuster(0.5),
    ],
    [],
    1.7,
    60950.2,
  );
}
