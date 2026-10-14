import * as numbers from "../../../../kit/numbers.js";
import { GlobalCohortScore } from "./global-cohort-score.js";

/** One step of the global cohort score calculation. */
export interface GlobalCohortScoreModifier {
  describe(): string;
  adjust(item: GlobalCohortScore, value: number): number;
}

export class GlobalCohortScoreScoreOffsetAdjuster implements GlobalCohortScoreModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: GlobalCohortScore, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentGlobalCohortScoreAdjuster implements GlobalCohortScoreModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalCohortScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalCohortScoreAdjuster implements GlobalCohortScoreModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalCohortScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalCohortScoreAdjuster implements GlobalCohortScoreModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalCohortScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionGlobalCohortScoreAdjuster implements GlobalCohortScoreModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: GlobalCohortScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredGlobalCohortScoreAdjuster implements GlobalCohortScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalCohortScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global cohort score steps in order and keeps a trace of each. */
export class GlobalCohortScoreEngine {
  steps: GlobalCohortScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCohortScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalCohortScore): number {
    let current = item.projectedValue();
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

  evaluateAll(items: GlobalCohortScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalCohortScoreEngine(): GlobalCohortScoreEngine {
  return new GlobalCohortScoreEngine(
    [
      new GlobalCohortScoreScoreOffsetAdjuster(1.14),
      new PercentGlobalCohortScoreAdjuster(24.8),
      new CapGlobalCohortScoreAdjuster(4424),
      new MinimumGlobalCohortScoreAdjuster(27.8),
      new RegionGlobalCohortScoreAdjuster(new Map<string, number>([["central", 1.05]])),
      new TieredGlobalCohortScoreAdjuster([263, 2673, 8788], [1.07, 1.14, 0.89]),
    ],
    [],
    3.8,
    91604.9,
  );
}
