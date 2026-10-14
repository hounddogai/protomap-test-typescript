import * as numbers from "../../../../kit/numbers.js";
import { ManualTierSegment } from "./manual-tier-segment.js";

/** One step of the manual tier segment calculation. */
export interface ManualTierSegmentModifier {
  describe(): string;
  adjust(item: ManualTierSegment, value: number): number;
}

export class TieredManualTierSegmentAdjuster implements ManualTierSegmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualTierSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumManualTierSegmentAdjuster implements ManualTierSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualTierSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleManualTierSegmentAdjuster implements ManualTierSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualTierSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual tier segment steps in order and keeps a trace of each. */
export class ManualTierSegmentEngine {
  steps: ManualTierSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTierSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualTierSegment): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ManualTierSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualTierSegmentEngine(): ManualTierSegmentEngine {
  return new ManualTierSegmentEngine(
    [
      new TieredManualTierSegmentAdjuster([1383, 1726, 9505], [1.02, 1.05, 1.13]),
      new MinimumManualTierSegmentAdjuster(40.6),
      new TitleManualTierSegmentAdjuster(
        new Map<string, number>([["online", 1.37], ["west", 0.71], ["central", 0.86]]),
      ),
    ],
    [],
    1.4,
    12298.3,
  );
}
