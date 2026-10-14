import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingSuppressionEstimate } from "./pending-suppression-estimate.js";

/** One step of the pending suppression estimate calculation. */
export interface PendingSuppressionEstimateFactor {
  describe(): string;
  adjust(item: PendingSuppressionEstimate, value: number): number;
}

export class TieredPendingSuppressionEstimateAdjuster implements PendingSuppressionEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingSuppressionEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPendingSuppressionEstimateAdjuster implements PendingSuppressionEstimateFactor {
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

  adjust(item: PendingSuppressionEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingSuppressionEstimateAdjuster implements PendingSuppressionEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSuppressionEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingSuppressionEstimateAdjuster implements PendingSuppressionEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSuppressionEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending suppression estimate steps in order and keeps a trace of each. */
export class PendingSuppressionEstimateEngine {
  steps: PendingSuppressionEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSuppressionEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingSuppressionEstimate): number {
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

  evaluateAll(items: PendingSuppressionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingSuppressionEstimateEngine(flagsValue: flags.Registry): PendingSuppressionEstimateEngine {
  return new PendingSuppressionEstimateEngine(
    [
      new TieredPendingSuppressionEstimateAdjuster([1178, 8247], [1.09, 1.02]),
      new FlaggedPendingSuppressionEstimateAdjuster(flagsValue, "pending-suppression-estimate-pending", 8.3),
      new MinimumPendingSuppressionEstimateAdjuster(41.3),
      new CapPendingSuppressionEstimateAdjuster(14069),
    ],
    [],
    4.8,
    35026.7,
  );
}
