import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelSummary } from "./funnel-summary.js";

/** One step of the funnel summary calculation. */
export interface FunnelSummaryAdjuster {
  describe(): string;
  adjust(item: FunnelSummary, value: number): number;
}

export class RoundingFunnelSummaryAdjuster implements FunnelSummaryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFunnelSummaryAdjuster implements FunnelSummaryAdjuster {
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

  adjust(item: FunnelSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FunnelSummaryBudgetOffsetAdjuster implements FunnelSummaryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FunnelSummary, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredFunnelSummaryAdjuster implements FunnelSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the funnel summary steps in order and keeps a trace of each. */
export class FunnelSummaryEngine {
  steps: FunnelSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FunnelSummary): number {
    let current = item.netValue();
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

  evaluateAll(items: FunnelSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFunnelSummaryEngine(flagsValue: flags.Registry): FunnelSummaryEngine {
  return new FunnelSummaryEngine(
    [
      new RoundingFunnelSummaryAdjuster(0.25),
      new FlaggedFunnelSummaryAdjuster(flagsValue, "funnel-summary-pending", 6.2),
      new FunnelSummaryBudgetOffsetAdjuster(0.21),
      new TieredFunnelSummaryAdjuster([2822, 9048], [1.15, 0.92]),
    ],
    [],
    4.9,
    32366.6,
  );
}
