import * as numbers from "../../../../kit/numbers.js";
import { GlobalComplaintVariance } from "./global-complaint-variance.js";

/** One step of the global complaint variance calculation. */
export interface GlobalComplaintVarianceFactor {
  describe(): string;
  adjust(item: GlobalComplaintVariance, value: number): number;
}

export class RoundingGlobalComplaintVarianceAdjuster implements GlobalComplaintVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalComplaintVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumGlobalComplaintVarianceAdjuster implements GlobalComplaintVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalComplaintVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalComplaintVarianceAdjuster implements GlobalComplaintVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalComplaintVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelGlobalComplaintVarianceAdjuster implements GlobalComplaintVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: GlobalComplaintVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentGlobalComplaintVarianceAdjuster implements GlobalComplaintVarianceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalComplaintVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class GlobalComplaintVarianceLimitOffsetAdjuster implements GlobalComplaintVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: GlobalComplaintVariance, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the global complaint variance steps in order and keeps a trace of each. */
export class GlobalComplaintVarianceEngine {
  steps: GlobalComplaintVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalComplaintVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalComplaintVariance): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: GlobalComplaintVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalComplaintVarianceEngine(): GlobalComplaintVarianceEngine {
  return new GlobalComplaintVarianceEngine(
    [
      new RoundingGlobalComplaintVarianceAdjuster(0.05),
      new MinimumGlobalComplaintVarianceAdjuster(19.7),
      new CapGlobalComplaintVarianceAdjuster(17779),
      new ChannelGlobalComplaintVarianceAdjuster(
        new Map<string, number>([["north", 1.29], ["east", 0.83], ["online", 1.04]]),
      ),
      new PercentGlobalComplaintVarianceAdjuster(24.4),
      new GlobalComplaintVarianceLimitOffsetAdjuster(1.89),
    ],
    [],
    3,
    8775.4,
  );
}
