import * as numbers from "../../../../kit/numbers.js";
import { PlacementEntry } from "./placement-entry.js";

/** One step of the placement entry calculation. */
export interface PlacementEntryStep {
  describe(): string;
  adjust(item: PlacementEntry, value: number): number;
}

export class MinimumPlacementEntryAdjuster implements PlacementEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPlacementEntryAdjuster implements PlacementEntryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPlacementEntryAdjuster implements PlacementEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPlacementEntryAdjuster implements PlacementEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PlacementEntryGraceDaysOffsetAdjuster implements PlacementEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PlacementEntry, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the placement entry steps in order and keeps a trace of each. */
export class PlacementEntryEngine {
  steps: PlacementEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementEntry): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PlacementEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementEntryEngine(): PlacementEntryEngine {
  return new PlacementEntryEngine(
    [
      new MinimumPlacementEntryAdjuster(22.8),
      new RoundingPlacementEntryAdjuster(5),
      new TieredPlacementEntryAdjuster([2868, 4282], [0.8, 1.16]),
      new PercentPlacementEntryAdjuster(-13.6),
      new PlacementEntryGraceDaysOffsetAdjuster(0.5),
    ],
    [],
    4.6,
    92360.9,
  );
}
