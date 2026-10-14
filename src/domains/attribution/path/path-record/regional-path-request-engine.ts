import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalPathRequest } from "./regional-path-request.js";

/** One step of the regional path request calculation. */
export interface RegionalPathRequestStep {
  describe(): string;
  adjust(item: RegionalPathRequest, value: number): number;
}

export class RegionalPathRequestRateOffsetAdjuster implements RegionalPathRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: RegionalPathRequest, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class FlaggedRegionalPathRequestAdjuster implements RegionalPathRequestStep {
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

  adjust(item: RegionalPathRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalPathRequestAdjuster implements RegionalPathRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPathRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryRegionalPathRequestAdjuster implements RegionalPathRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RegionalPathRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional path request steps in order and keeps a trace of each. */
export class RegionalPathRequestEngine {
  steps: RegionalPathRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPathRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalPathRequest): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RegionalPathRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalPathRequestEngine(flagsValue: flags.Registry): RegionalPathRequestEngine {
  return new RegionalPathRequestEngine(
    [
      new RegionalPathRequestRateOffsetAdjuster(1.65),
      new FlaggedRegionalPathRequestAdjuster(flagsValue, "regional-path-request-tiered", 9.3),
      new CapRegionalPathRequestAdjuster(47140),
      new CategoryRegionalPathRequestAdjuster(new Map<string, number>([["east", 1.21], ["central", 1]])),
    ],
    [],
    1.6,
    71723.4,
  );
}
