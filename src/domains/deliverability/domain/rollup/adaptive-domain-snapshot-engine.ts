import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveDomainSnapshot } from "./adaptive-domain-snapshot.js";

/** One step of the adaptive domain snapshot calculation. */
export interface AdaptiveDomainSnapshotStep {
  describe(): string;
  adjust(item: AdaptiveDomainSnapshot, value: number): number;
}

export class LabelAdaptiveDomainSnapshotAdjuster implements AdaptiveDomainSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptiveDomainSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptiveDomainSnapshotAdjuster implements AdaptiveDomainSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveDomainSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveDomainSnapshotAdjuster implements AdaptiveDomainSnapshotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveDomainSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingAdaptiveDomainSnapshotAdjuster implements AdaptiveDomainSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveDomainSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveDomainSnapshotImpressionsOffsetAdjuster implements AdaptiveDomainSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: AdaptiveDomainSnapshot, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the adaptive domain snapshot steps in order and keeps a trace of each. */
export class AdaptiveDomainSnapshotEngine {
  steps: AdaptiveDomainSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDomainSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveDomainSnapshot): number {
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

  evaluateAll(items: AdaptiveDomainSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveDomainSnapshotEngine(): AdaptiveDomainSnapshotEngine {
  return new AdaptiveDomainSnapshotEngine(
    [
      new LabelAdaptiveDomainSnapshotAdjuster(
        new Map<string, number>([["online", 1.31], ["west", 1.3], ["north", 0.9]]),
      ),
      new TieredAdaptiveDomainSnapshotAdjuster([454, 1189, 7977], [0.92, 1.14, 0.99]),
      new CapAdaptiveDomainSnapshotAdjuster(14575),
      new RoundingAdaptiveDomainSnapshotAdjuster(0.5),
      new AdaptiveDomainSnapshotImpressionsOffsetAdjuster(0.28),
    ],
    [],
    2.5,
    65395.7,
  );
}
