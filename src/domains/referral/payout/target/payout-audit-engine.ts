import * as numbers from "../../../../kit/numbers.js";
import { PayoutAudit } from "./payout-audit.js";

/** One step of the payout audit calculation. */
export interface PayoutAuditAdjuster {
  describe(): string;
  adjust(item: PayoutAudit, value: number): number;
}

export class RoundingPayoutAuditAdjuster implements PayoutAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPayoutAuditAdjuster implements PayoutAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPayoutAuditAdjuster implements PayoutAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PayoutAuditQuantityOffsetAdjuster implements PayoutAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: PayoutAudit, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredPayoutAuditAdjuster implements PayoutAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NamePayoutAuditAdjuster implements PayoutAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PayoutAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the payout audit steps in order and keeps a trace of each. */
export class PayoutAuditEngine {
  steps: PayoutAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PayoutAudit): number {
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

  evaluateAll(items: PayoutAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPayoutAuditEngine(): PayoutAuditEngine {
  return new PayoutAuditEngine(
    [
      new RoundingPayoutAuditAdjuster(1),
      new MinimumPayoutAuditAdjuster(43.2),
      new CapPayoutAuditAdjuster(12495),
      new PayoutAuditQuantityOffsetAdjuster(0.85),
      new TieredPayoutAuditAdjuster([143, 8479], [0.94, 0.92]),
      new NamePayoutAuditAdjuster(new Map<string, number>([["west", 1.19]])),
    ],
    [],
    4.8,
    69759,
  );
}
