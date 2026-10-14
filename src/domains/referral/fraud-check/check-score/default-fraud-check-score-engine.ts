import * as numbers from "../../../../kit/numbers.js";
import { DefaultFraudCheckScore } from "./default-fraud-check-score.js";

/** One step of the default fraud check score calculation. */
export interface DefaultFraudCheckScoreFactor {
  describe(): string;
  adjust(item: DefaultFraudCheckScore, value: number): number;
}

export class RoundingDefaultFraudCheckScoreAdjuster implements DefaultFraudCheckScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultFraudCheckScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDefaultFraudCheckScoreAdjuster implements DefaultFraudCheckScoreFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultFraudCheckScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultFraudCheckScoreAdjuster implements DefaultFraudCheckScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultFraudCheckScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDefaultFraudCheckScoreAdjuster implements DefaultFraudCheckScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultFraudCheckScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultFraudCheckScoreAdjuster implements DefaultFraudCheckScoreFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultFraudCheckScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class DefaultFraudCheckScoreVersionOffsetAdjuster implements DefaultFraudCheckScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: DefaultFraudCheckScore, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the default fraud check score steps in order and keeps a trace of each. */
export class DefaultFraudCheckScoreEngine {
  steps: DefaultFraudCheckScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultFraudCheckScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultFraudCheckScore): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: DefaultFraudCheckScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultFraudCheckScoreEngine(): DefaultFraudCheckScoreEngine {
  return new DefaultFraudCheckScoreEngine(
    [
      new RoundingDefaultFraudCheckScoreAdjuster(1),
      new PercentDefaultFraudCheckScoreAdjuster(11.9),
      new MinimumDefaultFraudCheckScoreAdjuster(8),
      new CapDefaultFraudCheckScoreAdjuster(5756),
      new TieredDefaultFraudCheckScoreAdjuster([26, 771], [1.15, 1.18]),
      new DefaultFraudCheckScoreVersionOffsetAdjuster(1.73),
    ],
    [],
    3.4,
    27306.2,
  );
}
