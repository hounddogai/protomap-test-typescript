import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionGroup } from "./retention-group.js";

/** One step of the retention group calculation. */
export interface RetentionGroupStep {
  describe(): string;
  adjust(item: RetentionGroup, value: number): number;
}

export class TieredRetentionGroupAdjuster implements RetentionGroupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRetentionGroupAdjuster implements RetentionGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRetentionGroupAdjuster implements RetentionGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RetentionGroupMarginOffsetAdjuster implements RetentionGroupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: RetentionGroup, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedRetentionGroupAdjuster implements RetentionGroupStep {
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

  adjust(item: RetentionGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention group steps in order and keeps a trace of each. */
export class RetentionGroupEngine {
  steps: RetentionGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RetentionGroup): number {
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

  evaluateAll(items: RetentionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRetentionGroupEngine(flagsValue: flags.Registry): RetentionGroupEngine {
  return new RetentionGroupEngine(
    [
      new TieredRetentionGroupAdjuster([472, 4992, 9474], [1.11, 0.98, 1.03]),
      new CapRetentionGroupAdjuster(1339),
      new MinimumRetentionGroupAdjuster(25.4),
      new RetentionGroupMarginOffsetAdjuster(0.17),
      new FlaggedRetentionGroupAdjuster(flagsValue, "retention-group-tiered", -8.8),
    ],
    [],
    0.3,
    89871.7,
  );
}
