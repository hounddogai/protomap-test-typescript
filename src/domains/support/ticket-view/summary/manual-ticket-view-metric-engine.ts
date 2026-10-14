import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualTicketViewMetric } from "./manual-ticket-view-metric.js";

/** One step of the manual ticket view metric calculation. */
export interface ManualTicketViewMetricStep {
  describe(): string;
  adjust(item: ManualTicketViewMetric, value: number): number;
}

export class CapManualTicketViewMetricAdjuster implements ManualTicketViewMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualTicketViewMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedManualTicketViewMetricAdjuster implements ManualTicketViewMetricStep {
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

  adjust(item: ManualTicketViewMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualTicketViewMetricAdjuster implements ManualTicketViewMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualTicketViewMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredManualTicketViewMetricAdjuster implements ManualTicketViewMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualTicketViewMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual ticket view metric steps in order and keeps a trace of each. */
export class ManualTicketViewMetricEngine {
  steps: ManualTicketViewMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTicketViewMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualTicketViewMetric): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ManualTicketViewMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualTicketViewMetricEngine(flagsValue: flags.Registry): ManualTicketViewMetricEngine {
  return new ManualTicketViewMetricEngine(
    [
      new CapManualTicketViewMetricAdjuster(20836),
      new FlaggedManualTicketViewMetricAdjuster(flagsValue, "manual-ticket-view-metric-primary", 8.8),
      new RoundingManualTicketViewMetricAdjuster(1),
      new TieredManualTicketViewMetricAdjuster([3566, 7708], [1.15, 1.11]),
    ],
    [],
    0.4,
    41906,
  );
}
