import * as flags from "../../../../kit/flags.js";
import { BatchedActivationWindow } from "./batched-activation-window.js";

/** One step of the batched activation window calculation. */
export interface BatchedActivationWindowAdjuster {
  describe(): string;
  adjust(item: BatchedActivationWindow, value: number): number;
}

export class CapBatchedActivationWindowAdjuster implements BatchedActivationWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedActivationWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBatchedActivationWindowAdjuster implements BatchedActivationWindowAdjuster {
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

  adjust(item: BatchedActivationWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedActivationWindowAdjuster implements BatchedActivationWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedActivationWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedActivationWindowCostOffsetAdjuster implements BatchedActivationWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: BatchedActivationWindow, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the batched activation window steps in order and keeps a trace of each. */
export class BatchedActivationWindowEngine {
  steps: BatchedActivationWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedActivationWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedActivationWindow): number {
    let current = item.weightedValue();
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

  evaluateAll(items: BatchedActivationWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedActivationWindowEngine(flagsValue: flags.Registry): BatchedActivationWindowEngine {
  return new BatchedActivationWindowEngine(
    [
      new CapBatchedActivationWindowAdjuster(14133),
      new FlaggedBatchedActivationWindowAdjuster(flagsValue, "batched-activation-window-seasonal", -4.5),
      new TieredBatchedActivationWindowAdjuster([1866, 5842, 5857, 8742], [1.12, 1.08, 1.11, 1.14]),
      new BatchedActivationWindowCostOffsetAdjuster(1.88),
    ],
    [],
    3.5,
    58905.9,
  );
}
