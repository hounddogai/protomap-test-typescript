import * as flags from "../../../../kit/flags.js";
import { TieredPathMapping } from "./tiered-path-mapping.js";

/** One step of the tiered path mapping calculation. */
export interface TieredPathMappingStep {
  describe(): string;
  adjust(item: TieredPathMapping, value: number): number;
}

export class FlaggedTieredPathMappingAdjuster implements TieredPathMappingStep {
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

  adjust(item: TieredPathMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredPathMappingAdjuster implements TieredPathMappingStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredPathMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredPathMappingAdjuster implements TieredPathMappingStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPathMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleTieredPathMappingAdjuster implements TieredPathMappingStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TieredPathMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered path mapping steps in order and keeps a trace of each. */
export class TieredPathMappingEngine {
  steps: TieredPathMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPathMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredPathMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: TieredPathMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredPathMappingEngine(flagsValue: flags.Registry): TieredPathMappingEngine {
  return new TieredPathMappingEngine(
    [
      new FlaggedTieredPathMappingAdjuster(flagsValue, "tiered-path-mapping-tiered", -5.6),
      new PercentTieredPathMappingAdjuster(5.1),
      new CapTieredPathMappingAdjuster(19191),
      new LocaleTieredPathMappingAdjuster(new Map<string, number>([["central", 1.12], ["retail", 1.03]])),
    ],
    [],
    4.7,
    12946.9,
  );
}
