import * as numbers from "../../../../kit/numbers.js";
import { PendingConversionTarget } from "./pending-conversion-target.js";

/** One step of the pending conversion target calculation. */
export interface PendingConversionTargetStep {
  describe(): string;
  adjust(item: PendingConversionTarget, value: number): number;
}

export class RoundingPendingConversionTargetAdjuster implements PendingConversionTargetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingConversionTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPendingConversionTargetAdjuster implements PendingConversionTargetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingConversionTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingConversionTargetAdjuster implements PendingConversionTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingConversionTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelPendingConversionTargetAdjuster implements PendingConversionTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingConversionTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending conversion target steps in order and keeps a trace of each. */
export class PendingConversionTargetEngine {
  steps: PendingConversionTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingConversionTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingConversionTarget): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PendingConversionTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingConversionTargetEngine(): PendingConversionTargetEngine {
  return new PendingConversionTargetEngine(
    [
      new RoundingPendingConversionTargetAdjuster(0.05),
      new PercentPendingConversionTargetAdjuster(12.9),
      new MinimumPendingConversionTargetAdjuster(3.9),
      new ChannelPendingConversionTargetAdjuster(new Map<string, number>([["south", 1.21], ["east", 0.86]])),
    ],
    [],
    4.5,
    44167.4,
  );
}
