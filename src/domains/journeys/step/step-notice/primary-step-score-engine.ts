import * as numbers from "../../../../kit/numbers.js";
import { PrimaryStepScore } from "./primary-step-score.js";

/** One step of the primary step score calculation. */
export interface PrimaryStepScoreModifier {
  describe(): string;
  adjust(item: PrimaryStepScore, value: number): number;
}

export class PrimaryStepScoreSequenceOffsetAdjuster implements PrimaryStepScoreModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: PrimaryStepScore, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class CapPrimaryStepScoreAdjuster implements PrimaryStepScoreModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryStepScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimaryStepScoreAdjuster implements PrimaryStepScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryStepScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryStepScoreAdjuster implements PrimaryStepScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryStepScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentPrimaryStepScoreAdjuster implements PrimaryStepScoreModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PrimaryStepScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPrimaryStepScoreAdjuster implements PrimaryStepScoreModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryStepScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary step score steps in order and keeps a trace of each. */
export class PrimaryStepScoreEngine {
  steps: PrimaryStepScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryStepScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryStepScore): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PrimaryStepScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryStepScoreEngine(): PrimaryStepScoreEngine {
  return new PrimaryStepScoreEngine(
    [
      new PrimaryStepScoreSequenceOffsetAdjuster(1.1),
      new CapPrimaryStepScoreAdjuster(4186),
      new RoundingPrimaryStepScoreAdjuster(0.25),
      new TieredPrimaryStepScoreAdjuster([44, 1521, 3036, 8164], [0.8, 1.07, 0.94, 0.93]),
      new SegmentPrimaryStepScoreAdjuster(new Map<string, number>([["east", 1.37], ["retail", 0.91]])),
      new MinimumPrimaryStepScoreAdjuster(46),
    ],
    [],
    4.6,
    38398.2,
  );
}
