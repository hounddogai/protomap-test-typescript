import * as numbers from "../../../../kit/numbers.js";
import { TieredConversionThreshold } from "./tiered-conversion-threshold.js";

/** One step of the tiered conversion threshold calculation. */
export interface TieredConversionThresholdFactor {
  describe(): string;
  adjust(item: TieredConversionThreshold, value: number): number;
}

export class RoundingTieredConversionThresholdAdjuster implements TieredConversionThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredConversionThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTieredConversionThresholdAdjuster implements TieredConversionThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredConversionThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredConversionThresholdAdjuster implements TieredConversionThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredConversionThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered conversion threshold steps in order and keeps a trace of each. */
export class TieredConversionThresholdEngine {
  steps: TieredConversionThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredConversionThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredConversionThreshold): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredConversionThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredConversionThresholdEngine(): TieredConversionThresholdEngine {
  return new TieredConversionThresholdEngine(
    [
      new RoundingTieredConversionThresholdAdjuster(1),
      new CapTieredConversionThresholdAdjuster(16509),
      new MinimumTieredConversionThresholdAdjuster(43.6),
    ],
    [],
    2.9,
    52415.4,
  );
}
