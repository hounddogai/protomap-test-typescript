import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSuppressionQuota } from "./scheduled-suppression-quota.js";

/** One step of the scheduled suppression quota calculation. */
export interface ScheduledSuppressionQuotaAdjuster {
  describe(): string;
  adjust(item: ScheduledSuppressionQuota, value: number): number;
}

export class TieredScheduledSuppressionQuotaAdjuster implements ScheduledSuppressionQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledSuppressionQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ScheduledSuppressionQuotaRetriesOffsetAdjuster implements ScheduledSuppressionQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ScheduledSuppressionQuota, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapScheduledSuppressionQuotaAdjuster implements ScheduledSuppressionQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledSuppressionQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionScheduledSuppressionQuotaAdjuster implements ScheduledSuppressionQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ScheduledSuppressionQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled suppression quota steps in order and keeps a trace of each. */
export class ScheduledSuppressionQuotaEngine {
  steps: ScheduledSuppressionQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSuppressionQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledSuppressionQuota): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ScheduledSuppressionQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledSuppressionQuotaEngine(): ScheduledSuppressionQuotaEngine {
  return new ScheduledSuppressionQuotaEngine(
    [
      new TieredScheduledSuppressionQuotaAdjuster([539, 1962, 5203, 5391], [1.03, 0.83, 1.05, 1.13]),
      new ScheduledSuppressionQuotaRetriesOffsetAdjuster(0.94),
      new CapScheduledSuppressionQuotaAdjuster(32257),
      new RegionScheduledSuppressionQuotaAdjuster(new Map<string, number>([["west", 1.27], ["retail", 1.27]])),
    ],
    [],
    0.9,
    23292,
  );
}
