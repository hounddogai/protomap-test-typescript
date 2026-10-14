import * as numbers from "../../../../kit/numbers.js";
import { RollingRewardRequest } from "./rolling-reward-request.js";

/** One step of the rolling reward request calculation. */
export interface RollingRewardRequestAdjuster {
  describe(): string;
  adjust(item: RollingRewardRequest, value: number): number;
}

export class TieredRollingRewardRequestAdjuster implements RollingRewardRequestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingRewardRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingRewardRequestAdjuster implements RollingRewardRequestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingRewardRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionRollingRewardRequestAdjuster implements RollingRewardRequestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RollingRewardRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingRewardRequestImpressionsOffsetAdjuster implements RollingRewardRequestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: RollingRewardRequest, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingRollingRewardRequestAdjuster implements RollingRewardRequestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingRewardRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRollingRewardRequestAdjuster implements RollingRewardRequestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingRewardRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling reward request steps in order and keeps a trace of each. */
export class RollingRewardRequestEngine {
  steps: RollingRewardRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingRewardRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingRewardRequest): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RollingRewardRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingRewardRequestEngine(): RollingRewardRequestEngine {
  return new RollingRewardRequestEngine(
    [
      new TieredRollingRewardRequestAdjuster([1401, 2065, 2177, 5991], [0.93, 1.14, 1.02, 0.88]),
      new CapRollingRewardRequestAdjuster(1435),
      new RegionRollingRewardRequestAdjuster(new Map<string, number>([["north", 0.75], ["west", 1.06]])),
      new RollingRewardRequestImpressionsOffsetAdjuster(0.38),
      new RoundingRollingRewardRequestAdjuster(5),
      new PercentRollingRewardRequestAdjuster(19.8),
    ],
    [],
    4.5,
    67956.9,
  );
}
