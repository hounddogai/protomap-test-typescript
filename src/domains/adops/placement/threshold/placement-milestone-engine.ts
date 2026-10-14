import * as numbers from "../../../../kit/numbers.js";
import { PlacementMilestone } from "./placement-milestone.js";

/** One step of the placement milestone calculation. */
export interface PlacementMilestoneModifier {
  describe(): string;
  adjust(item: PlacementMilestone, value: number): number;
}

export class LocalePlacementMilestoneAdjuster implements PlacementMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PlacementMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPlacementMilestoneAdjuster implements PlacementMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPlacementMilestoneAdjuster implements PlacementMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PlacementMilestoneMinimumOffsetAdjuster implements PlacementMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: PlacementMilestone, value: number): number {
    return value + item.minimum * this.weight;
  }
}

/** Runs the placement milestone steps in order and keeps a trace of each. */
export class PlacementMilestoneEngine {
  steps: PlacementMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PlacementMilestone): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PlacementMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPlacementMilestoneEngine(): PlacementMilestoneEngine {
  return new PlacementMilestoneEngine(
    [
      new LocalePlacementMilestoneAdjuster(new Map<string, number>([["retail", 0.76]])),
      new CapPlacementMilestoneAdjuster(37607),
      new PercentPlacementMilestoneAdjuster(18.1),
      new PlacementMilestoneMinimumOffsetAdjuster(0.04),
    ],
    [],
    0.1,
    37220.9,
  );
}
