import * as flags from "../../../../kit/flags.js";
import { WaitAdjustment } from "./wait-adjustment.js";

/** One step of the wait adjustment calculation. */
export interface WaitAdjustmentStep {
  describe(): string;
  adjust(item: WaitAdjustment, value: number): number;
}

export class FlaggedWaitAdjustmentAdjuster implements WaitAdjustmentStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WaitAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWaitAdjustmentAdjuster implements WaitAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWaitAdjustmentAdjuster implements WaitAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the wait adjustment steps in order and keeps a trace of each. */
export class WaitAdjustmentEngine {
  steps: WaitAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WaitAdjustment): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WaitAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWaitAdjustmentEngine(flagsValue: flags.Registry): WaitAdjustmentEngine {
  return new WaitAdjustmentEngine(
    [
      new FlaggedWaitAdjustmentAdjuster(flagsValue, "wait-adjustment-capped", 6.9),
      new MinimumWaitAdjustmentAdjuster(36.9),
      new TieredWaitAdjustmentAdjuster([7534, 9408], [0.82, 0.95]),
    ],
    [],
    4.2,
    12190.6,
  );
}
