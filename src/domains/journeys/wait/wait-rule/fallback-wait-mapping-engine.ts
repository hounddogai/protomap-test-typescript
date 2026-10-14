import * as flags from "../../../../kit/flags.js";
import { FallbackWaitMapping } from "./fallback-wait-mapping.js";

/** One step of the fallback wait mapping calculation. */
export interface FallbackWaitMappingFactor {
  describe(): string;
  adjust(item: FallbackWaitMapping, value: number): number;
}

export class FallbackWaitMappingClicksOffsetAdjuster implements FallbackWaitMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: FallbackWaitMapping, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class FlaggedFallbackWaitMappingAdjuster implements FallbackWaitMappingFactor {
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

  adjust(item: FallbackWaitMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackWaitMappingAdjuster implements FallbackWaitMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackWaitMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFallbackWaitMappingAdjuster implements FallbackWaitMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackWaitMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback wait mapping steps in order and keeps a trace of each. */
export class FallbackWaitMappingEngine {
  steps: FallbackWaitMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackWaitMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackWaitMapping): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackWaitMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackWaitMappingEngine(flagsValue: flags.Registry): FallbackWaitMappingEngine {
  return new FallbackWaitMappingEngine(
    [
      new FallbackWaitMappingClicksOffsetAdjuster(0.3),
      new FlaggedFallbackWaitMappingAdjuster(flagsValue, "fallback-wait-mapping-manual", -6.4),
      new TieredFallbackWaitMappingAdjuster([5803, 8079, 8336, 8827], [1.04, 0.92, 1.06, 0.82]),
      new MinimumFallbackWaitMappingAdjuster(23),
    ],
    [],
    0.6,
    98441.7,
  );
}
