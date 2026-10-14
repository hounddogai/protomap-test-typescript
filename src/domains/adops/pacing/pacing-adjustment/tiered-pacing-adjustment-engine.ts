import * as numbers from "../../../../kit/numbers.js";
import { TieredPacingAdjustment } from "./tiered-pacing-adjustment.js";

/** One step of the tiered pacing adjustment calculation. */
export interface TieredPacingAdjustmentFactor {
  describe(): string;
  adjust(item: TieredPacingAdjustment, value: number): number;
}

export class MinimumTieredPacingAdjustmentAdjuster implements TieredPacingAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredPacingAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPacingAdjustmentBudgetOffsetAdjuster implements TieredPacingAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TieredPacingAdjustment, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredTieredPacingAdjustmentAdjuster implements TieredPacingAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredPacingAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTieredPacingAdjustmentAdjuster implements TieredPacingAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredPacingAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelTieredPacingAdjustmentAdjuster implements TieredPacingAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredPacingAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered pacing adjustment steps in order and keeps a trace of each. */
export class TieredPacingAdjustmentEngine {
  steps: TieredPacingAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPacingAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredPacingAdjustment): number {
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

  evaluateAll(items: TieredPacingAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredPacingAdjustmentEngine(): TieredPacingAdjustmentEngine {
  return new TieredPacingAdjustmentEngine(
    [
      new MinimumTieredPacingAdjustmentAdjuster(15.9),
      new TieredPacingAdjustmentBudgetOffsetAdjuster(0.11),
      new TieredTieredPacingAdjustmentAdjuster([616, 3439, 4869, 9511], [1.02, 1.03, 1.18, 0.95]),
      new PercentTieredPacingAdjustmentAdjuster(-15.8),
      new LabelTieredPacingAdjustmentAdjuster(new Map<string, number>([["online", 1.04], ["north", 1.34]])),
    ],
    [],
    3.5,
    5874.3,
  );
}
