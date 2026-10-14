import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingJourneySummary } from "./rolling-journey-summary.js";

/** One step of the rolling journey summary calculation. */
export interface RollingJourneySummaryStep {
  describe(): string;
  adjust(item: RollingJourneySummary, value: number): number;
}

export class CapRollingJourneySummaryAdjuster implements RollingJourneySummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingJourneySummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingJourneySummaryPriorityOffsetAdjuster implements RollingJourneySummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: RollingJourneySummary, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedRollingJourneySummaryAdjuster implements RollingJourneySummaryStep {
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

  adjust(item: RollingJourneySummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingJourneySummaryAdjuster implements RollingJourneySummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingJourneySummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRollingJourneySummaryAdjuster implements RollingJourneySummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingJourneySummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryRollingJourneySummaryAdjuster implements RollingJourneySummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RollingJourneySummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling journey summary steps in order and keeps a trace of each. */
export class RollingJourneySummaryEngine {
  steps: RollingJourneySummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingJourneySummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingJourneySummary): number {
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

  evaluateAll(items: RollingJourneySummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingJourneySummaryEngine(flagsValue: flags.Registry): RollingJourneySummaryEngine {
  return new RollingJourneySummaryEngine(
    [
      new CapRollingJourneySummaryAdjuster(38120),
      new RollingJourneySummaryPriorityOffsetAdjuster(1.3),
      new FlaggedRollingJourneySummaryAdjuster(flagsValue, "rolling-journey-summary-manual", -1.2),
      new MinimumRollingJourneySummaryAdjuster(28.8),
      new TieredRollingJourneySummaryAdjuster([1534, 4930, 6177], [1.12, 1, 0.97]),
      new CategoryRollingJourneySummaryAdjuster(new Map<string, number>([["retail", 1.09]])),
    ],
    [],
    2.3,
    62910.1,
  );
}
