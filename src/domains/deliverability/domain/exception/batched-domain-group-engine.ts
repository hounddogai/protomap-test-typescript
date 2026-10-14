import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedDomainGroup } from "./batched-domain-group.js";

/** One step of the batched domain group calculation. */
export interface BatchedDomainGroupAdjuster {
  describe(): string;
  adjust(item: BatchedDomainGroup, value: number): number;
}

export class MinimumBatchedDomainGroupAdjuster implements BatchedDomainGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedDomainGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryBatchedDomainGroupAdjuster implements BatchedDomainGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedDomainGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBatchedDomainGroupAdjuster implements BatchedDomainGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedDomainGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBatchedDomainGroupAdjuster implements BatchedDomainGroupAdjuster {
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

  adjust(item: BatchedDomainGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched domain group steps in order and keeps a trace of each. */
export class BatchedDomainGroupEngine {
  steps: BatchedDomainGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedDomainGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedDomainGroup): number {
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

  evaluateAll(items: BatchedDomainGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedDomainGroupEngine(flagsValue: flags.Registry): BatchedDomainGroupEngine {
  return new BatchedDomainGroupEngine(
    [
      new MinimumBatchedDomainGroupAdjuster(32.4),
      new CountryBatchedDomainGroupAdjuster(new Map<string, number>([["east", 0.95]])),
      new RoundingBatchedDomainGroupAdjuster(0.5),
      new FlaggedBatchedDomainGroupAdjuster(flagsValue, "batched-domain-group-global", -2.9),
    ],
    [],
    3.6,
    30249.4,
  );
}
