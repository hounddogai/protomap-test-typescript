import * as flags from "../../../../kit/flags.js";
import { WarmupSummary } from "./warmup-summary.js";

/** One step of the warmup summary calculation. */
export interface WarmupSummaryStep {
  describe(): string;
  adjust(item: WarmupSummary, value: number): number;
}

export class TieredWarmupSummaryAdjuster implements WarmupSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWarmupSummaryAdjuster implements WarmupSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedWarmupSummaryAdjuster implements WarmupSummaryStep {
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

  adjust(item: WarmupSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleWarmupSummaryAdjuster implements WarmupSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WarmupSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WarmupSummaryPriorityOffsetAdjuster implements WarmupSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: WarmupSummary, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class CapWarmupSummaryAdjuster implements WarmupSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the warmup summary steps in order and keeps a trace of each. */
export class WarmupSummaryEngine {
  steps: WarmupSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WarmupSummary): number {
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

  evaluateAll(items: WarmupSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWarmupSummaryEngine(flagsValue: flags.Registry): WarmupSummaryEngine {
  return new WarmupSummaryEngine(
    [
      new TieredWarmupSummaryAdjuster([1248, 2444], [0.83, 0.87]),
      new PercentWarmupSummaryAdjuster(1.9),
      new FlaggedWarmupSummaryAdjuster(flagsValue, "warmup-summary-weighted", -1.6),
      new TitleWarmupSummaryAdjuster(
        new Map<string, number>([["online", 0.95], ["south", 1.07], ["north", 0.74]]),
      ),
      new WarmupSummaryPriorityOffsetAdjuster(0.65),
      new CapWarmupSummaryAdjuster(47359),
    ],
    [],
    1,
    53070.1,
  );
}
