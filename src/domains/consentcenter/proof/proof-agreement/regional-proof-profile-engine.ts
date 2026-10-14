import * as numbers from "../../../../kit/numbers.js";
import { RegionalProofProfile } from "./regional-proof-profile.js";

/** One step of the regional proof profile calculation. */
export interface RegionalProofProfileAdjuster {
  describe(): string;
  adjust(item: RegionalProofProfile, value: number): number;
}

export class RegionalProofProfileVersionOffsetAdjuster implements RegionalProofProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RegionalProofProfile, value: number): number {
    return value + item.version * this.weight;
  }
}

export class CapRegionalProofProfileAdjuster implements RegionalProofProfileAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalProofProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelRegionalProofProfileAdjuster implements RegionalProofProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RegionalProofProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRegionalProofProfileAdjuster implements RegionalProofProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalProofProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRegionalProofProfileAdjuster implements RegionalProofProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalProofProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional proof profile steps in order and keeps a trace of each. */
export class RegionalProofProfileEngine {
  steps: RegionalProofProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalProofProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalProofProfile): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RegionalProofProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalProofProfileEngine(): RegionalProofProfileEngine {
  return new RegionalProofProfileEngine(
    [
      new RegionalProofProfileVersionOffsetAdjuster(1.71),
      new CapRegionalProofProfileAdjuster(38300),
      new ChannelRegionalProofProfileAdjuster(new Map<string, number>([["central", 1.3], ["west", 0.78]])),
      new RoundingRegionalProofProfileAdjuster(5),
      new TieredRegionalProofProfileAdjuster([255, 7275, 8600], [0.99, 0.94, 0.91]),
    ],
    [],
    0.2,
    52416.1,
  );
}
