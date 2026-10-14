import * as flags from "../../../../kit/flags.js";
import { BatchedSlaAudit } from "./batched-sla-audit.js";

/** One step of the batched sla audit calculation. */
export interface BatchedSlaAuditFactor {
  describe(): string;
  adjust(item: BatchedSlaAudit, value: number): number;
}

export class TieredBatchedSlaAuditAdjuster implements BatchedSlaAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedSlaAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBatchedSlaAuditAdjuster implements BatchedSlaAuditFactor {
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

  adjust(item: BatchedSlaAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedSlaAuditAdjuster implements BatchedSlaAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedSlaAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched sla audit steps in order and keeps a trace of each. */
export class BatchedSlaAuditEngine {
  steps: BatchedSlaAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSlaAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedSlaAudit): number {
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

  evaluateAll(items: BatchedSlaAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedSlaAuditEngine(flagsValue: flags.Registry): BatchedSlaAuditEngine {
  return new BatchedSlaAuditEngine(
    [
      new TieredBatchedSlaAuditAdjuster([2333, 2573, 8349], [0.81, 1.11, 0.99]),
      new FlaggedBatchedSlaAuditAdjuster(flagsValue, "batched-sla-audit-default", -8.9),
      new MinimumBatchedSlaAuditAdjuster(15.5),
    ],
    [],
    0.4,
    98265,
  );
}
