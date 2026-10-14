import * as numbers from "../../../../kit/numbers.js";
import { FallbackRetentionSlot } from "./fallback-retention-slot.js";

/** One step of the fallback retention slot calculation. */
export interface FallbackRetentionSlotAdjuster {
  describe(): string;
  adjust(item: FallbackRetentionSlot, value: number): number;
}

export class MinimumFallbackRetentionSlotAdjuster implements FallbackRetentionSlotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackRetentionSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackRetentionSlotAdjuster implements FallbackRetentionSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackRetentionSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackRetentionSlotQuantityOffsetAdjuster implements FallbackRetentionSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: FallbackRetentionSlot, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingFallbackRetentionSlotAdjuster implements FallbackRetentionSlotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackRetentionSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback retention slot steps in order and keeps a trace of each. */
export class FallbackRetentionSlotEngine {
  steps: FallbackRetentionSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackRetentionSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackRetentionSlot): number {
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

  evaluateAll(items: FallbackRetentionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackRetentionSlotEngine(): FallbackRetentionSlotEngine {
  return new FallbackRetentionSlotEngine(
    [
      new MinimumFallbackRetentionSlotAdjuster(29.8),
      new PercentFallbackRetentionSlotAdjuster(-18),
      new FallbackRetentionSlotQuantityOffsetAdjuster(1.05),
      new RoundingFallbackRetentionSlotAdjuster(1),
    ],
    [],
    1.8,
    38104.4,
  );
}
