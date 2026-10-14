import * as numbers from "../../../../kit/numbers.js";
import { CappedCreditSegment } from "./capped-credit-segment.js";

/** One step of the capped credit segment calculation. */
export interface CappedCreditSegmentStep {
  describe(): string;
  adjust(item: CappedCreditSegment, value: number): number;
}

export class RoundingCappedCreditSegmentAdjuster implements CappedCreditSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedCreditSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleCappedCreditSegmentAdjuster implements CappedCreditSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedCreditSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCappedCreditSegmentAdjuster implements CappedCreditSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedCreditSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped credit segment steps in order and keeps a trace of each. */
export class CappedCreditSegmentEngine {
  steps: CappedCreditSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedCreditSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedCreditSegment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: CappedCreditSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedCreditSegmentEngine(): CappedCreditSegmentEngine {
  return new CappedCreditSegmentEngine(
    [
      new RoundingCappedCreditSegmentAdjuster(1),
      new TitleCappedCreditSegmentAdjuster(new Map<string, number>([["north", 0.8], ["south", 1.2]])),
      new TieredCappedCreditSegmentAdjuster([1993, 4279], [1.11, 0.99]),
    ],
    [],
    4.8,
    11666.8,
  );
}
