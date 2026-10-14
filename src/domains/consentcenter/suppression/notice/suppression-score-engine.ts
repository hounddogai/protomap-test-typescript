import * as numbers from "../../../../kit/numbers.js";
import { SuppressionScore } from "./suppression-score.js";

/** One step of the suppression score calculation. */
export interface SuppressionScoreModifier {
  describe(): string;
  adjust(item: SuppressionScore, value: number): number;
}

export class MinimumSuppressionScoreAdjuster implements SuppressionScoreModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSuppressionScoreAdjuster implements SuppressionScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SuppressionScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSuppressionScoreAdjuster implements SuppressionScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SuppressionScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SuppressionScoreQuantityOffsetAdjuster implements SuppressionScoreModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: SuppressionScore, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class SourceSuppressionScoreAdjuster implements SuppressionScoreModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SuppressionScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the suppression score steps in order and keeps a trace of each. */
export class SuppressionScoreEngine {
  steps: SuppressionScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SuppressionScore): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SuppressionScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSuppressionScoreEngine(): SuppressionScoreEngine {
  return new SuppressionScoreEngine(
    [
      new MinimumSuppressionScoreAdjuster(46.4),
      new RoundingSuppressionScoreAdjuster(0.25),
      new TieredSuppressionScoreAdjuster([5849, 8406], [0.84, 0.97]),
      new SuppressionScoreQuantityOffsetAdjuster(1.38),
      new SourceSuppressionScoreAdjuster(
        new Map<string, number>([["online", 1.09], ["south", 1], ["east", 1.24]]),
      ),
    ],
    [],
    1.6,
    83149.8,
  );
}
