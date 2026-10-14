import * as flags from "../../../../kit/flags.js";
import { GlobalDomainGroup } from "./global-domain-group.js";

/** One step of the global domain group calculation. */
export interface GlobalDomainGroupModifier {
  describe(): string;
  adjust(item: GlobalDomainGroup, value: number): number;
}

export class SegmentGlobalDomainGroupAdjuster implements GlobalDomainGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: GlobalDomainGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredGlobalDomainGroupAdjuster implements GlobalDomainGroupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalDomainGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapGlobalDomainGroupAdjuster implements GlobalDomainGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalDomainGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalDomainGroupAdjuster implements GlobalDomainGroupModifier {
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

  adjust(item: GlobalDomainGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global domain group steps in order and keeps a trace of each. */
export class GlobalDomainGroupEngine {
  steps: GlobalDomainGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalDomainGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalDomainGroup): number {
    let current = item.weightedValue();
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

  evaluateAll(items: GlobalDomainGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalDomainGroupEngine(flagsValue: flags.Registry): GlobalDomainGroupEngine {
  return new GlobalDomainGroupEngine(
    [
      new SegmentGlobalDomainGroupAdjuster(new Map<string, number>([["west", 1.06]])),
      new TieredGlobalDomainGroupAdjuster([3041, 4933], [1, 0.95]),
      new CapGlobalDomainGroupAdjuster(39759),
      new FlaggedGlobalDomainGroupAdjuster(flagsValue, "global-domain-group-adaptive", 3.6),
    ],
    [],
    3.4,
    73146.9,
  );
}
