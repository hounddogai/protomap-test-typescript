import * as numbers from "../../../../kit/numbers.js";
import { ChallengeAdjustment } from "./challenge-adjustment.js";

/** One step of the challenge adjustment calculation. */
export interface ChallengeAdjustmentStep {
  describe(): string;
  adjust(item: ChallengeAdjustment, value: number): number;
}

export class TieredChallengeAdjustmentAdjuster implements ChallengeAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChallengeAdjustmentStartsAtOffsetAdjuster implements ChallengeAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: ChallengeAdjustment, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class LocaleChallengeAdjustmentAdjuster implements ChallengeAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ChallengeAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingChallengeAdjustmentAdjuster implements ChallengeAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentChallengeAdjustmentAdjuster implements ChallengeAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapChallengeAdjustmentAdjuster implements ChallengeAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the challenge adjustment steps in order and keeps a trace of each. */
export class ChallengeAdjustmentEngine {
  steps: ChallengeAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ChallengeAdjustment): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ChallengeAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultChallengeAdjustmentEngine(): ChallengeAdjustmentEngine {
  return new ChallengeAdjustmentEngine(
    [
      new TieredChallengeAdjustmentAdjuster([2423, 7134, 7919], [0.96, 0.96, 1.12]),
      new ChallengeAdjustmentStartsAtOffsetAdjuster(0.73),
      new LocaleChallengeAdjustmentAdjuster(new Map<string, number>([["online", 1.3]])),
      new RoundingChallengeAdjustmentAdjuster(0.25),
      new PercentChallengeAdjustmentAdjuster(-5.7),
      new CapChallengeAdjustmentAdjuster(7397),
    ],
    [],
    1.9,
    42905.5,
  );
}
