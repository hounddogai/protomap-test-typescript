import * as numbers from "../../../../kit/numbers.js";
import { RegionalPlacementProfile } from "./regional-placement-profile.js";

/** One step of the regional placement profile calculation. */
export interface RegionalPlacementProfileStep {
  describe(): string;
  adjust(item: RegionalPlacementProfile, value: number): number;
}

export class RegionalPlacementProfileStartsAtOffsetAdjuster implements RegionalPlacementProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: RegionalPlacementProfile, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class TieredRegionalPlacementProfileAdjuster implements RegionalPlacementProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPlacementProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRegionalPlacementProfileAdjuster implements RegionalPlacementProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPlacementProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional placement profile steps in order and keeps a trace of each. */
export class RegionalPlacementProfileEngine {
  steps: RegionalPlacementProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPlacementProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalPlacementProfile): number {
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

  evaluateAll(items: RegionalPlacementProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalPlacementProfileEngine(): RegionalPlacementProfileEngine {
  return new RegionalPlacementProfileEngine(
    [
      new RegionalPlacementProfileStartsAtOffsetAdjuster(1.72),
      new TieredRegionalPlacementProfileAdjuster([1740, 2249, 5924], [1.15, 1.18, 0.82]),
      new CapRegionalPlacementProfileAdjuster(49271),
    ],
    [],
    2.6,
    36693.6,
  );
}
