import * as numbers from "../../../../kit/numbers.js";
import { PlacementRollup } from "./placement-rollup.js";

/** One step of the placement rollup calculation. */
export interface PlacementRollupFactor {
  describe(): string;
  adjust(item: PlacementRollup, value: number): number;
}

export class RoundingPlacementRollupAdjuster implements PlacementRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PlacementRollupGraceDaysOffsetAdjuster implements PlacementRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PlacementRollup, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class ChannelPlacementRollupAdjuster implements PlacementRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PlacementRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPlacementRollupAdjuster implements PlacementRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the placement rollup steps in order and keeps a trace of each. */
export class PlacementRollupEngine {
  steps: PlacementRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PlacementRollup): number {
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

  evaluateAll(items: PlacementRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPlacementRollupEngine(): PlacementRollupEngine {
  return new PlacementRollupEngine(
    [
      new RoundingPlacementRollupAdjuster(0.25),
      new PlacementRollupGraceDaysOffsetAdjuster(0.74),
      new ChannelPlacementRollupAdjuster(new Map<string, number>([["online", 0.88], ["retail", 0.8]])),
      new CapPlacementRollupAdjuster(30984),
    ],
    [],
    3.5,
    88432.7,
  );
}
