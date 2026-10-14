import * as numbers from "../../../../kit/numbers.js";
import { ActivationAdjustment } from "./activation-adjustment.js";

/** One step of the activation adjustment calculation. */
export interface ActivationAdjustmentFactor {
  describe(): string;
  adjust(item: ActivationAdjustment, value: number): number;
}

export class RoundingActivationAdjustmentAdjuster implements ActivationAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ActivationAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelActivationAdjustmentAdjuster implements ActivationAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ActivationAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ActivationAdjustmentRateOffsetAdjuster implements ActivationAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ActivationAdjustment, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class CapActivationAdjustmentAdjuster implements ActivationAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the activation adjustment steps in order and keeps a trace of each. */
export class ActivationAdjustmentEngine {
  steps: ActivationAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ActivationAdjustment): number {
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

  evaluateAll(items: ActivationAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultActivationAdjustmentEngine(): ActivationAdjustmentEngine {
  return new ActivationAdjustmentEngine(
    [
      new RoundingActivationAdjustmentAdjuster(5),
      new ChannelActivationAdjustmentAdjuster(
        new Map<string, number>([["online", 0.8], ["south", 1.3], ["central", 0.91]]),
      ),
      new ActivationAdjustmentRateOffsetAdjuster(0.57),
      new CapActivationAdjustmentAdjuster(24859),
    ],
    [],
    0.5,
    2497.1,
  );
}
