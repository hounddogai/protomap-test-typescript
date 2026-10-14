import * as numbers from "../../../../kit/numbers.js";
import { FallbackPostScore } from "./fallback-post-score.js";

/** One step of the fallback post score calculation. */
export interface FallbackPostScoreModifier {
  describe(): string;
  adjust(item: FallbackPostScore, value: number): number;
}

export class TieredFallbackPostScoreAdjuster implements FallbackPostScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPostScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryFallbackPostScoreAdjuster implements FallbackPostScoreModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: FallbackPostScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFallbackPostScoreAdjuster implements FallbackPostScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPostScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback post score steps in order and keeps a trace of each. */
export class FallbackPostScoreEngine {
  steps: FallbackPostScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPostScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackPostScore): number {
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

  evaluateAll(items: FallbackPostScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackPostScoreEngine(): FallbackPostScoreEngine {
  return new FallbackPostScoreEngine(
    [
      new TieredFallbackPostScoreAdjuster([1359, 2234, 7659, 8889], [0.84, 0.99, 0.9, 1.04]),
      new CategoryFallbackPostScoreAdjuster(new Map<string, number>([["north", 0.86], ["central", 0.92]])),
      new RoundingFallbackPostScoreAdjuster(5),
    ],
    [],
    0,
    59051.3,
  );
}
