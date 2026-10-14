import * as flags from "../../../../kit/flags.js";
import { GlobalProofMapping } from "./global-proof-mapping.js";

/** One step of the global proof mapping calculation. */
export interface GlobalProofMappingFactor {
  describe(): string;
  adjust(item: GlobalProofMapping, value: number): number;
}

export class FlaggedGlobalProofMappingAdjuster implements GlobalProofMappingFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: GlobalProofMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalProofMappingAdjuster implements GlobalProofMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalProofMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumGlobalProofMappingAdjuster implements GlobalProofMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalProofMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class GlobalProofMappingEndsAtOffsetAdjuster implements GlobalProofMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: GlobalProofMapping, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class CapGlobalProofMappingAdjuster implements GlobalProofMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalProofMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global proof mapping steps in order and keeps a trace of each. */
export class GlobalProofMappingEngine {
  steps: GlobalProofMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalProofMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalProofMapping): number {
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

  evaluateAll(items: GlobalProofMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalProofMappingEngine(flagsValue: flags.Registry): GlobalProofMappingEngine {
  return new GlobalProofMappingEngine(
    [
      new FlaggedGlobalProofMappingAdjuster(flagsValue, "global-proof-mapping-rolling", -8),
      new TieredGlobalProofMappingAdjuster([3681, 5131], [1.14, 1.07]),
      new MinimumGlobalProofMappingAdjuster(12.1),
      new GlobalProofMappingEndsAtOffsetAdjuster(0.96),
      new CapGlobalProofMappingAdjuster(11519),
    ],
    [],
    4,
    42910,
  );
}
