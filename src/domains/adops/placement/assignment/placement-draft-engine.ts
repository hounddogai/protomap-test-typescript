import * as numbers from "../../../../kit/numbers.js";
import { PlacementDraft } from "./placement-draft.js";

/** One step of the placement draft calculation. */
export interface PlacementDraftAdjuster {
  describe(): string;
  adjust(item: PlacementDraft, value: number): number;
}

export class TieredPlacementDraftAdjuster implements PlacementDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPlacementDraftAdjuster implements PlacementDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PlacementDraftEndsAtOffsetAdjuster implements PlacementDraftAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: PlacementDraft, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class RoundingPlacementDraftAdjuster implements PlacementDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the placement draft steps in order and keeps a trace of each. */
export class PlacementDraftEngine {
  steps: PlacementDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementDraft): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PlacementDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementDraftEngine(): PlacementDraftEngine {
  return new PlacementDraftEngine(
    [
      new TieredPlacementDraftAdjuster([1108, 1272, 2701, 3272], [1.01, 1.08, 0.8, 1.14]),
      new CapPlacementDraftAdjuster(3883),
      new PlacementDraftEndsAtOffsetAdjuster(1.11),
      new RoundingPlacementDraftAdjuster(5),
    ],
    [],
    3.2,
    88653.4,
  );
}
