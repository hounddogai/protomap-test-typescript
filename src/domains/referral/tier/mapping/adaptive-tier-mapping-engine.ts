import * as flags from "../../../../kit/flags.js";
import { AdaptiveTierMapping } from "./adaptive-tier-mapping.js";

/** One step of the adaptive tier mapping calculation. */
export interface AdaptiveTierMappingFactor {
  describe(): string;
  adjust(item: AdaptiveTierMapping, value: number): number;
}

export class TieredAdaptiveTierMappingAdjuster implements AdaptiveTierMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveTierMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptiveTierMappingAdjuster implements AdaptiveTierMappingFactor {
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

  adjust(item: AdaptiveTierMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveTierMappingAdjuster implements AdaptiveTierMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveTierMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveTierMappingAdjuster implements AdaptiveTierMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveTierMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive tier mapping steps in order and keeps a trace of each. */
export class AdaptiveTierMappingEngine {
  steps: AdaptiveTierMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveTierMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveTierMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptiveTierMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveTierMappingEngine(flagsValue: flags.Registry): AdaptiveTierMappingEngine {
  return new AdaptiveTierMappingEngine(
    [
      new TieredAdaptiveTierMappingAdjuster([4239, 5236, 8300], [1.04, 0.83, 1.03]),
      new FlaggedAdaptiveTierMappingAdjuster(flagsValue, "adaptive-tier-mapping-seasonal", -6.6),
      new CapAdaptiveTierMappingAdjuster(13114),
      new MinimumAdaptiveTierMappingAdjuster(49),
    ],
    [],
    2.2,
    52125.9,
  );
}
