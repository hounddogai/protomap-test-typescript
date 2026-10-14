import * as numbers from "../../../../kit/numbers.js";
import { RegionalChallengeMapping } from "./regional-challenge-mapping.js";

/** One step of the regional challenge mapping calculation. */
export interface RegionalChallengeMappingAdjuster {
  describe(): string;
  adjust(item: RegionalChallengeMapping, value: number): number;
}

export class RoundingRegionalChallengeMappingAdjuster implements RegionalChallengeMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalChallengeMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalChallengeMappingAdjuster implements RegionalChallengeMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalChallengeMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryRegionalChallengeMappingAdjuster implements RegionalChallengeMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RegionalChallengeMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional challenge mapping steps in order and keeps a trace of each. */
export class RegionalChallengeMappingEngine {
  steps: RegionalChallengeMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalChallengeMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalChallengeMapping): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RegionalChallengeMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalChallengeMappingEngine(): RegionalChallengeMappingEngine {
  return new RegionalChallengeMappingEngine(
    [
      new RoundingRegionalChallengeMappingAdjuster(0.05),
      new MinimumRegionalChallengeMappingAdjuster(16.2),
      new CategoryRegionalChallengeMappingAdjuster(new Map<string, number>([["west", 0.98], ["central", 1.28]])),
    ],
    [],
    4.6,
    80224.2,
  );
}
