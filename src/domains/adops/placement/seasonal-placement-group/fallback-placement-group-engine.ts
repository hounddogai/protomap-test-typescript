import { FallbackPlacementGroup } from "./fallback-placement-group.js";

/** One step of the fallback placement group calculation. */
export interface FallbackPlacementGroupModifier {
  describe(): string;
  adjust(item: FallbackPlacementGroup, value: number): number;
}

export class CapFallbackPlacementGroupAdjuster implements FallbackPlacementGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPlacementGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackPlacementGroupFloorValueOffsetAdjuster implements FallbackPlacementGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: FallbackPlacementGroup, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class SegmentFallbackPlacementGroupAdjuster implements FallbackPlacementGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: FallbackPlacementGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback placement group steps in order and keeps a trace of each. */
export class FallbackPlacementGroupEngine {
  steps: FallbackPlacementGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPlacementGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackPlacementGroup): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: FallbackPlacementGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackPlacementGroupEngine(): FallbackPlacementGroupEngine {
  return new FallbackPlacementGroupEngine(
    [
      new CapFallbackPlacementGroupAdjuster(2069),
      new FallbackPlacementGroupFloorValueOffsetAdjuster(0.22),
      new SegmentFallbackPlacementGroupAdjuster(
        new Map<string, number>([["central", 1.36], ["south", 1.35], ["west", 1.37]]),
      ),
    ],
    [],
    0.8,
    92260.1,
  );
}
