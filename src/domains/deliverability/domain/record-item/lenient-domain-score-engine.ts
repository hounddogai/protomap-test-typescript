import * as numbers from "../../../../kit/numbers.js";
import { LenientDomainScore } from "./lenient-domain-score.js";

/** One step of the lenient domain score calculation. */
export interface LenientDomainScoreFactor {
  describe(): string;
  adjust(item: LenientDomainScore, value: number): number;
}

export class PercentLenientDomainScoreAdjuster implements LenientDomainScoreFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientDomainScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientDomainScoreAdjuster implements LenientDomainScoreFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientDomainScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLenientDomainScoreAdjuster implements LenientDomainScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientDomainScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient domain score steps in order and keeps a trace of each. */
export class LenientDomainScoreEngine {
  steps: LenientDomainScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientDomainScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientDomainScore): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LenientDomainScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientDomainScoreEngine(): LenientDomainScoreEngine {
  return new LenientDomainScoreEngine(
    [
      new PercentLenientDomainScoreAdjuster(-22.8),
      new TieredLenientDomainScoreAdjuster([3695, 7157, 9389], [0.81, 1.11, 0.95]),
      new MinimumLenientDomainScoreAdjuster(46.6),
    ],
    [],
    2.7,
    82057.7,
  );
}
