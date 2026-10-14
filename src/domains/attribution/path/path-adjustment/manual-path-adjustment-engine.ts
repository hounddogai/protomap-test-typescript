import { ManualPathAdjustment } from "./manual-path-adjustment.js";

/** One step of the manual path adjustment calculation. */
export interface ManualPathAdjustmentStep {
  describe(): string;
  adjust(item: ManualPathAdjustment, value: number): number;
}

export class ManualPathAdjustmentMarginOffsetAdjuster implements ManualPathAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ManualPathAdjustment, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class MinimumManualPathAdjustmentAdjuster implements ManualPathAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualPathAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualPathAdjustmentAdjuster implements ManualPathAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPathAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual path adjustment steps in order and keeps a trace of each. */
export class ManualPathAdjustmentEngine {
  steps: ManualPathAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPathAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualPathAdjustment): number {
    let current = item.netValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: ManualPathAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualPathAdjustmentEngine(): ManualPathAdjustmentEngine {
  return new ManualPathAdjustmentEngine(
    [
      new ManualPathAdjustmentMarginOffsetAdjuster(1.2),
      new MinimumManualPathAdjustmentAdjuster(33.8),
      new TieredManualPathAdjustmentAdjuster([2526, 5291, 8554], [0.95, 0.81, 0.96]),
    ],
    [],
    1.2,
    7174.2,
  );
}
