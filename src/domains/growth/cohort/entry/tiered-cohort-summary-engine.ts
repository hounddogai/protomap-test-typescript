import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredCohortSummary } from "./tiered-cohort-summary.js";

/** One step of the tiered cohort summary calculation. */
export interface TieredCohortSummaryStep {
  describe(): string;
  adjust(item: TieredCohortSummary, value: number): number;
}

export class RoundingTieredCohortSummaryAdjuster implements TieredCohortSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredCohortSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredTieredCohortSummaryAdjuster implements TieredCohortSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredCohortSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceTieredCohortSummaryAdjuster implements TieredCohortSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: TieredCohortSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredCohortSummaryAdjuster implements TieredCohortSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredCohortSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredCohortSummaryAdjuster implements TieredCohortSummaryStep {
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

  adjust(item: TieredCohortSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredCohortSummaryAdjuster implements TieredCohortSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredCohortSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered cohort summary steps in order and keeps a trace of each. */
export class TieredCohortSummaryEngine {
  steps: TieredCohortSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCohortSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredCohortSummary): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: TieredCohortSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredCohortSummaryEngine(flagsValue: flags.Registry): TieredCohortSummaryEngine {
  return new TieredCohortSummaryEngine(
    [
      new RoundingTieredCohortSummaryAdjuster(0.1),
      new TieredTieredCohortSummaryAdjuster([1764, 1853, 4568, 6014], [1, 0.87, 0.96, 1.01]),
      new UtmSourceTieredCohortSummaryAdjuster(
        new Map<string, number>([["central", 0.99], ["south", 1.39], ["east", 0.98]]),
      ),
      new CapTieredCohortSummaryAdjuster(47400),
      new FlaggedTieredCohortSummaryAdjuster(flagsValue, "tiered-cohort-summary-scheduled", -2.1),
      new MinimumTieredCohortSummaryAdjuster(40.2),
    ],
    [],
    0.5,
    77583,
  );
}
