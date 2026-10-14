import * as flags from "../../../../kit/flags.js";
import { PostAllocation } from "./post-allocation.js";

/** One step of the post allocation calculation. */
export interface PostAllocationAdjuster {
  describe(): string;
  adjust(item: PostAllocation, value: number): number;
}

export class FlaggedPostAllocationAdjuster implements PostAllocationAdjuster {
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

  adjust(item: PostAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryPostAllocationAdjuster implements PostAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PostAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPostAllocationAdjuster implements PostAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the post allocation steps in order and keeps a trace of each. */
export class PostAllocationEngine {
  steps: PostAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostAllocation): number {
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

  evaluateAll(items: PostAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostAllocationEngine(flagsValue: flags.Registry): PostAllocationEngine {
  return new PostAllocationEngine(
    [
      new FlaggedPostAllocationAdjuster(flagsValue, "post-allocation-seasonal", 2.2),
      new CategoryPostAllocationAdjuster(
        new Map<string, number>([["north", 1.19], ["online", 1.15], ["west", 0.73]]),
      ),
      new TieredPostAllocationAdjuster([1253, 7050], [1.15, 1.15]),
    ],
    [],
    1.2,
    99840.7,
  );
}
