import * as numbers from "../../../../kit/numbers.js";
import { WeightedPlacementSnapshot } from "./weighted-placement-snapshot.js";

/** One step of the weighted placement snapshot calculation. */
export interface WeightedPlacementSnapshotModifier {
  describe(): string;
  adjust(item: WeightedPlacementSnapshot, value: number): number;
}

export class ChannelWeightedPlacementSnapshotAdjuster implements WeightedPlacementSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedPlacementSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedPlacementSnapshotAdjuster implements WeightedPlacementSnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPlacementSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedPlacementSnapshotUpdatedAtOffsetAdjuster implements WeightedPlacementSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: WeightedPlacementSnapshot, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the weighted placement snapshot steps in order and keeps a trace of each. */
export class WeightedPlacementSnapshotEngine {
  steps: WeightedPlacementSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPlacementSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedPlacementSnapshot): number {
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

  evaluateAll(items: WeightedPlacementSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedPlacementSnapshotEngine(): WeightedPlacementSnapshotEngine {
  return new WeightedPlacementSnapshotEngine(
    [
      new ChannelWeightedPlacementSnapshotAdjuster(new Map<string, number>([["online", 1.17], ["east", 1.3]])),
      new MinimumWeightedPlacementSnapshotAdjuster(8.4),
      new WeightedPlacementSnapshotUpdatedAtOffsetAdjuster(1.73),
    ],
    [],
    1.5,
    97082.5,
  );
}
