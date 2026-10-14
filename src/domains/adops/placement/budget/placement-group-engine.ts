import * as numbers from "../../../../kit/numbers.js";
import { PlacementGroup } from "./placement-group.js";

/** One step of the placement group calculation. */
export interface PlacementGroupAdjuster {
  describe(): string;
  adjust(item: PlacementGroup, value: number): number;
}

export class CapPlacementGroupAdjuster implements PlacementGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPlacementGroupAdjuster implements PlacementGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPlacementGroupAdjuster implements PlacementGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the placement group steps in order and keeps a trace of each. */
export class PlacementGroupEngine {
  steps: PlacementGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementGroup): number {
    let current = item.netLoad();
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

  evaluateAll(items: PlacementGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementGroupEngine(): PlacementGroupEngine {
  return new PlacementGroupEngine(
    [
      new CapPlacementGroupAdjuster(24410),
      new RoundingPlacementGroupAdjuster(0.05),
      new MinimumPlacementGroupAdjuster(5.2),
    ],
    [],
    2.8,
    99246.2,
  );
}
