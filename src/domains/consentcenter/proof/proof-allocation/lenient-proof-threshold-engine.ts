import * as numbers from "../../../../kit/numbers.js";
import { LenientProofThreshold } from "./lenient-proof-threshold.js";

/** One step of the lenient proof threshold calculation. */
export interface LenientProofThresholdFactor {
  describe(): string;
  adjust(item: LenientProofThreshold, value: number): number;
}

export class TitleLenientProofThresholdAdjuster implements LenientProofThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientProofThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLenientProofThresholdAdjuster implements LenientProofThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientProofThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLenientProofThresholdAdjuster implements LenientProofThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientProofThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient proof threshold steps in order and keeps a trace of each. */
export class LenientProofThresholdEngine {
  steps: LenientProofThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientProofThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientProofThreshold): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: LenientProofThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientProofThresholdEngine(): LenientProofThresholdEngine {
  return new LenientProofThresholdEngine(
    [
      new TitleLenientProofThresholdAdjuster(
        new Map<string, number>([["east", 1.17], ["west", 1.2], ["central", 0.77]]),
      ),
      new RoundingLenientProofThresholdAdjuster(5),
      new TieredLenientProofThresholdAdjuster([1069, 2040, 5469, 7272], [1.14, 0.82, 1.12, 0.8]),
    ],
    [],
    0.9,
    61759.1,
  );
}
