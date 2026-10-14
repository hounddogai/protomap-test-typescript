import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathQuota } from "./path-quota.js";

/** One step of the path quota calculation. */
export interface PathQuotaModifier {
  describe(): string;
  adjust(item: PathQuota, value: number): number;
}

export class CapPathQuotaAdjuster implements PathQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPathQuotaAdjuster implements PathQuotaModifier {
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

  adjust(item: PathQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPathQuotaAdjuster implements PathQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the path quota steps in order and keeps a trace of each. */
export class PathQuotaEngine {
  steps: PathQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathQuota): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PathQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathQuotaEngine(flagsValue: flags.Registry): PathQuotaEngine {
  return new PathQuotaEngine(
    [
      new CapPathQuotaAdjuster(28047),
      new FlaggedPathQuotaAdjuster(flagsValue, "path-quota-weighted", 2.5),
      new TieredPathQuotaAdjuster([360, 1578, 6156, 7729], [1.06, 0.97, 1.13, 1.16]),
    ],
    [],
    3.6,
    81009.8,
  );
}
