import * as numbers from "../../../../kit/numbers.js";
import { LegacyReputationTarget } from "./legacy-reputation-target.js";

/** One step of the legacy reputation target calculation. */
export interface LegacyReputationTargetStep {
  describe(): string;
  adjust(item: LegacyReputationTarget, value: number): number;
}

export class LegacyReputationTargetRateOffsetAdjuster implements LegacyReputationTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: LegacyReputationTarget, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class TieredLegacyReputationTargetAdjuster implements LegacyReputationTargetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyReputationTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacyReputationTargetAdjuster implements LegacyReputationTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyReputationTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentLegacyReputationTargetAdjuster implements LegacyReputationTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LegacyReputationTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLegacyReputationTargetAdjuster implements LegacyReputationTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyReputationTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyReputationTargetAdjuster implements LegacyReputationTargetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyReputationTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy reputation target steps in order and keeps a trace of each. */
export class LegacyReputationTargetEngine {
  steps: LegacyReputationTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyReputationTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyReputationTarget): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: LegacyReputationTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyReputationTargetEngine(): LegacyReputationTargetEngine {
  return new LegacyReputationTargetEngine(
    [
      new LegacyReputationTargetRateOffsetAdjuster(0.21),
      new TieredLegacyReputationTargetAdjuster([326, 1005, 5075, 6837], [1.09, 1.06, 1.07, 1.19]),
      new CapLegacyReputationTargetAdjuster(13057),
      new SegmentLegacyReputationTargetAdjuster(new Map<string, number>([["south", 1.23]])),
      new MinimumLegacyReputationTargetAdjuster(2.5),
      new RoundingLegacyReputationTargetAdjuster(1),
    ],
    [],
    0.4,
    18835.7,
  );
}
