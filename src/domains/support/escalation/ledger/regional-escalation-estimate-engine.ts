import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalEscalationEstimate } from "./regional-escalation-estimate.js";

/** One step of the regional escalation estimate calculation. */
export interface RegionalEscalationEstimateStep {
  describe(): string;
  adjust(item: RegionalEscalationEstimate, value: number): number;
}

export class FlaggedRegionalEscalationEstimateAdjuster implements RegionalEscalationEstimateStep {
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

  adjust(item: RegionalEscalationEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalEscalationEstimateThresholdOffsetAdjuster implements RegionalEscalationEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: RegionalEscalationEstimate, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingRegionalEscalationEstimateAdjuster implements RegionalEscalationEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalEscalationEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalEscalationEstimateAdjuster implements RegionalEscalationEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalEscalationEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalEscalationEstimateAdjuster implements RegionalEscalationEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalEscalationEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalEscalationEstimateAdjuster implements RegionalEscalationEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalEscalationEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional escalation estimate steps in order and keeps a trace of each. */
export class RegionalEscalationEstimateEngine {
  steps: RegionalEscalationEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalEscalationEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalEscalationEstimate): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RegionalEscalationEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalEscalationEstimateEngine(flagsValue: flags.Registry): RegionalEscalationEstimateEngine {
  return new RegionalEscalationEstimateEngine(
    [
      new FlaggedRegionalEscalationEstimateAdjuster(flagsValue, "regional-escalation-estimate-capped", 0.1),
      new RegionalEscalationEstimateThresholdOffsetAdjuster(0.84),
      new RoundingRegionalEscalationEstimateAdjuster(5),
      new PercentRegionalEscalationEstimateAdjuster(-21.9),
      new MinimumRegionalEscalationEstimateAdjuster(33.2),
      new TieredRegionalEscalationEstimateAdjuster([624, 1528, 1612, 7086], [1.12, 1.1, 0.82, 1.09]),
    ],
    [],
    3.7,
    47526.6,
  );
}
