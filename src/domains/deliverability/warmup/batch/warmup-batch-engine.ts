import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupBatch } from "./warmup-batch.js";

/** One step of the warmup batch calculation. */
export interface WarmupBatchModifier {
  describe(): string;
  adjust(item: WarmupBatch, value: number): number;
}

export class FlaggedWarmupBatchAdjuster implements WarmupBatchModifier {
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

  adjust(item: WarmupBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWarmupBatchAdjuster implements WarmupBatchModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleWarmupBatchAdjuster implements WarmupBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WarmupBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWarmupBatchAdjuster implements WarmupBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the warmup batch steps in order and keeps a trace of each. */
export class WarmupBatchEngine {
  steps: WarmupBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WarmupBatch): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: WarmupBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWarmupBatchEngine(flagsValue: flags.Registry): WarmupBatchEngine {
  return new WarmupBatchEngine(
    [
      new FlaggedWarmupBatchAdjuster(flagsValue, "warmup-batch-pending", -1.5),
      new TieredWarmupBatchAdjuster([1348, 6404], [0.86, 0.93]),
      new TitleWarmupBatchAdjuster(
        new Map<string, number>([["online", 0.98], ["east", 0.78], ["retail", 0.96]]),
      ),
      new RoundingWarmupBatchAdjuster(0.25),
    ],
    [],
    3.8,
    12730.9,
  );
}
