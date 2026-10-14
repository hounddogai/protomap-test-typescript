import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TouchpointBatch } from "./touchpoint-batch.js";

/** One step of the touchpoint batch calculation. */
export interface TouchpointBatchModifier {
  describe(): string;
  adjust(item: TouchpointBatch, value: number): number;
}

export class CategoryTouchpointBatchAdjuster implements TouchpointBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TouchpointBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTouchpointBatchAdjuster implements TouchpointBatchModifier {
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

  adjust(item: TouchpointBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTouchpointBatchAdjuster implements TouchpointBatchModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTouchpointBatchAdjuster implements TouchpointBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the touchpoint batch steps in order and keeps a trace of each. */
export class TouchpointBatchEngine {
  steps: TouchpointBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TouchpointBatch): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: TouchpointBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTouchpointBatchEngine(flagsValue: flags.Registry): TouchpointBatchEngine {
  return new TouchpointBatchEngine(
    [
      new CategoryTouchpointBatchAdjuster(new Map<string, number>([["north", 0.94], ["online", 1.36]])),
      new FlaggedTouchpointBatchAdjuster(flagsValue, "touchpoint-batch-strict", -5.8),
      new TieredTouchpointBatchAdjuster([3644, 6537, 7359, 8948], [1.12, 1.07, 0.84, 1.13]),
      new CapTouchpointBatchAdjuster(21616),
    ],
    [],
    1.1,
    2102,
  );
}
