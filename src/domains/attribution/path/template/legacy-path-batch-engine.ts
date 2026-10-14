import * as numbers from "../../../../kit/numbers.js";
import { LegacyPathBatch } from "./legacy-path-batch.js";

/** One step of the legacy path batch calculation. */
export interface LegacyPathBatchAdjuster {
  describe(): string;
  adjust(item: LegacyPathBatch, value: number): number;
}

export class RoundingLegacyPathBatchAdjuster implements LegacyPathBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPathBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLegacyPathBatchAdjuster implements LegacyPathBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPathBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentLegacyPathBatchAdjuster implements LegacyPathBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LegacyPathBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLegacyPathBatchAdjuster implements LegacyPathBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyPathBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLegacyPathBatchAdjuster implements LegacyPathBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPathBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy path batch steps in order and keeps a trace of each. */
export class LegacyPathBatchEngine {
  steps: LegacyPathBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPathBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyPathBatch): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LegacyPathBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyPathBatchEngine(): LegacyPathBatchEngine {
  return new LegacyPathBatchEngine(
    [
      new RoundingLegacyPathBatchAdjuster(5),
      new CapLegacyPathBatchAdjuster(14758),
      new SegmentLegacyPathBatchAdjuster(new Map<string, number>([["north", 1.15], ["west", 0.96]])),
      new TieredLegacyPathBatchAdjuster([746, 4717, 7749, 9616], [1.16, 0.93, 1.13, 0.92]),
      new PercentLegacyPathBatchAdjuster(-10.1),
    ],
    [],
    3.6,
    88863.3,
  );
}
