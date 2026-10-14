import * as numbers from "../../../../kit/numbers.js";
import { CappedSenderQuota } from "./capped-sender-quota.js";

/** One step of the capped sender quota calculation. */
export interface CappedSenderQuotaAdjuster {
  describe(): string;
  adjust(item: CappedSenderQuota, value: number): number;
}

export class CapCappedSenderQuotaAdjuster implements CappedSenderQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedSenderQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedSenderQuotaAdjuster implements CappedSenderQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedSenderQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedSenderQuotaAdjuster implements CappedSenderQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedSenderQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionCappedSenderQuotaAdjuster implements CappedSenderQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: CappedSenderQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped sender quota steps in order and keeps a trace of each. */
export class CappedSenderQuotaEngine {
  steps: CappedSenderQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSenderQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedSenderQuota): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: CappedSenderQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedSenderQuotaEngine(): CappedSenderQuotaEngine {
  return new CappedSenderQuotaEngine(
    [
      new CapCappedSenderQuotaAdjuster(1061),
      new RoundingCappedSenderQuotaAdjuster(5),
      new MinimumCappedSenderQuotaAdjuster(39.3),
      new RegionCappedSenderQuotaAdjuster(new Map<string, number>([["online", 1.26], ["north", 1.01]])),
    ],
    [],
    1.5,
    21019.2,
  );
}
