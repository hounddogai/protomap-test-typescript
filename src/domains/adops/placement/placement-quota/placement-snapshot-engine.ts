import { PlacementSnapshot } from "./placement-snapshot.js";

/** One step of the placement snapshot calculation. */
export interface PlacementSnapshotModifier {
  describe(): string;
  adjust(item: PlacementSnapshot, value: number): number;
}

export class PlacementSnapshotUpdatedAtOffsetAdjuster implements PlacementSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: PlacementSnapshot, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class MinimumPlacementSnapshotAdjuster implements PlacementSnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocalePlacementSnapshotAdjuster implements PlacementSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PlacementSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPlacementSnapshotAdjuster implements PlacementSnapshotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the placement snapshot steps in order and keeps a trace of each. */
export class PlacementSnapshotEngine {
  steps: PlacementSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PlacementSnapshot): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PlacementSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPlacementSnapshotEngine(): PlacementSnapshotEngine {
  return new PlacementSnapshotEngine(
    [
      new PlacementSnapshotUpdatedAtOffsetAdjuster(0.15),
      new MinimumPlacementSnapshotAdjuster(46.7),
      new LocalePlacementSnapshotAdjuster(
        new Map<string, number>([["online", 1.07], ["south", 0.92], ["north", 1.26]]),
      ),
      new TieredPlacementSnapshotAdjuster([64, 1580, 8493, 8848], [1.1, 0.8, 0.97, 0.93]),
    ],
    [],
    4.6,
    93872.6,
  );
}
