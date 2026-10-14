import * as numbers from "../../../../kit/numbers.js";
import { ComplaintBundle } from "./complaint-bundle.js";

/** One step of the complaint bundle calculation. */
export interface ComplaintBundleAdjuster {
  describe(): string;
  adjust(item: ComplaintBundle, value: number): number;
}

export class TieredComplaintBundleAdjuster implements ComplaintBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumComplaintBundleAdjuster implements ComplaintBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ComplaintBundleSequenceOffsetAdjuster implements ComplaintBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: ComplaintBundle, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class ChannelComplaintBundleAdjuster implements ComplaintBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ComplaintBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentComplaintBundleAdjuster implements ComplaintBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingComplaintBundleAdjuster implements ComplaintBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the complaint bundle steps in order and keeps a trace of each. */
export class ComplaintBundleEngine {
  steps: ComplaintBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ComplaintBundle): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ComplaintBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultComplaintBundleEngine(): ComplaintBundleEngine {
  return new ComplaintBundleEngine(
    [
      new TieredComplaintBundleAdjuster([4168, 6895, 7778, 9907], [0.96, 1.11, 1.03, 1.05]),
      new MinimumComplaintBundleAdjuster(32.3),
      new ComplaintBundleSequenceOffsetAdjuster(0.1),
      new ChannelComplaintBundleAdjuster(new Map<string, number>([["west", 1.39], ["north", 0.82]])),
      new PercentComplaintBundleAdjuster(21.8),
      new RoundingComplaintBundleAdjuster(0.5),
    ],
    [],
    4.6,
    15052.1,
  );
}
