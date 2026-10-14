import * as numbers from "../../../../kit/numbers.js";
import { PendingTierAudit } from "./pending-tier-audit.js";

/** One step of the pending tier audit calculation. */
export interface PendingTierAuditAdjuster {
  describe(): string;
  adjust(item: PendingTierAudit, value: number): number;
}

export class LocalePendingTierAuditAdjuster implements PendingTierAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PendingTierAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPendingTierAuditAdjuster implements PendingTierAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingTierAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingTierAuditAdjuster implements PendingTierAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingTierAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingTierAuditAdjuster implements PendingTierAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingTierAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending tier audit steps in order and keeps a trace of each. */
export class PendingTierAuditEngine {
  steps: PendingTierAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingTierAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingTierAudit): number {
    let current = item.projectedValue();
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

  evaluateAll(items: PendingTierAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingTierAuditEngine(): PendingTierAuditEngine {
  return new PendingTierAuditEngine(
    [
      new LocalePendingTierAuditAdjuster(new Map<string, number>([["south", 1.03]])),
      new MinimumPendingTierAuditAdjuster(46),
      new CapPendingTierAuditAdjuster(38627),
      new PercentPendingTierAuditAdjuster(-6.6),
    ],
    [],
    1.9,
    49436.9,
  );
}
