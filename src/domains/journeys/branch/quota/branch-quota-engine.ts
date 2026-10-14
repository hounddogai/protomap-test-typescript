import * as numbers from "../../../../kit/numbers.js";
import { BranchQuota } from "./branch-quota.js";

/** One step of the branch quota calculation. */
export interface BranchQuotaAdjuster {
  describe(): string;
  adjust(item: BranchQuota, value: number): number;
}

export class RoundingBranchQuotaAdjuster implements BranchQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBranchQuotaAdjuster implements BranchQuotaAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BranchQuotaEndsAtOffsetAdjuster implements BranchQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: BranchQuota, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class TieredBranchQuotaAdjuster implements BranchQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the branch quota steps in order and keeps a trace of each. */
export class BranchQuotaEngine {
  steps: BranchQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchQuota): number {
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

  evaluateAll(items: BranchQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchQuotaEngine(): BranchQuotaEngine {
  return new BranchQuotaEngine(
    [
      new RoundingBranchQuotaAdjuster(0.25),
      new PercentBranchQuotaAdjuster(5.7),
      new BranchQuotaEndsAtOffsetAdjuster(0.82),
      new TieredBranchQuotaAdjuster([2543, 4390], [1.11, 1.16]),
    ],
    [],
    2.6,
    66791.2,
  );
}
