import * as numbers from "../../../../kit/numbers.js";
import { SeasonalFunnelSummary } from "./seasonal-funnel-summary.js";

/** One step of the seasonal funnel summary calculation. */
export interface SeasonalFunnelSummaryStep {
  describe(): string;
  adjust(item: SeasonalFunnelSummary, value: number): number;
}

export class PercentSeasonalFunnelSummaryAdjuster implements SeasonalFunnelSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalFunnelSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalFunnelSummaryFloorValueOffsetAdjuster implements SeasonalFunnelSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: SeasonalFunnelSummary, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class RoundingSeasonalFunnelSummaryAdjuster implements SeasonalFunnelSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalFunnelSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSeasonalFunnelSummaryAdjuster implements SeasonalFunnelSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalFunnelSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSeasonalFunnelSummaryAdjuster implements SeasonalFunnelSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalFunnelSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumSeasonalFunnelSummaryAdjuster implements SeasonalFunnelSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalFunnelSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal funnel summary steps in order and keeps a trace of each. */
export class SeasonalFunnelSummaryEngine {
  steps: SeasonalFunnelSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalFunnelSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalFunnelSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalFunnelSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalFunnelSummaryEngine(): SeasonalFunnelSummaryEngine {
  return new SeasonalFunnelSummaryEngine(
    [
      new PercentSeasonalFunnelSummaryAdjuster(13.9),
      new SeasonalFunnelSummaryFloorValueOffsetAdjuster(0.02),
      new RoundingSeasonalFunnelSummaryAdjuster(0.05),
      new CapSeasonalFunnelSummaryAdjuster(15361),
      new TieredSeasonalFunnelSummaryAdjuster([8351, 9936], [0.97, 0.8]),
      new MinimumSeasonalFunnelSummaryAdjuster(12.8),
    ],
    [],
    2.7,
    54738.1,
  );
}
