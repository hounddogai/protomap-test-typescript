import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalBounceSummary } from "./global-bounce-summary.js";

/** One step of the global bounce summary calculation. */
export interface GlobalBounceSummaryStep {
  describe(): string;
  adjust(item: GlobalBounceSummary, value: number): number;
}

export class TieredGlobalBounceSummaryAdjuster implements GlobalBounceSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalBounceSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapGlobalBounceSummaryAdjuster implements GlobalBounceSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalBounceSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalBounceSummaryAdjuster implements GlobalBounceSummaryStep {
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

  adjust(item: GlobalBounceSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class GlobalBounceSummaryThresholdOffsetAdjuster implements GlobalBounceSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: GlobalBounceSummary, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingGlobalBounceSummaryAdjuster implements GlobalBounceSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalBounceSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameGlobalBounceSummaryAdjuster implements GlobalBounceSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: GlobalBounceSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global bounce summary steps in order and keeps a trace of each. */
export class GlobalBounceSummaryEngine {
  steps: GlobalBounceSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalBounceSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalBounceSummary): number {
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

  evaluateAll(items: GlobalBounceSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalBounceSummaryEngine(flagsValue: flags.Registry): GlobalBounceSummaryEngine {
  return new GlobalBounceSummaryEngine(
    [
      new TieredGlobalBounceSummaryAdjuster([1794, 2399], [0.81, 0.83]),
      new CapGlobalBounceSummaryAdjuster(31702),
      new FlaggedGlobalBounceSummaryAdjuster(flagsValue, "global-bounce-summary-scheduled", 8.2),
      new GlobalBounceSummaryThresholdOffsetAdjuster(0.74),
      new RoundingGlobalBounceSummaryAdjuster(5),
      new NameGlobalBounceSummaryAdjuster(new Map<string, number>([["west", 1.12]])),
    ],
    [],
    2.1,
    73455.6,
  );
}
