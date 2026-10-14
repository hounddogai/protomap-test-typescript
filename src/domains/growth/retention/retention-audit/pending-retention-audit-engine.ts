import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingRetentionAudit } from "./pending-retention-audit.js";

/** One step of the pending retention audit calculation. */
export interface PendingRetentionAuditFactor {
  describe(): string;
  adjust(item: PendingRetentionAudit, value: number): number;
}

export class FlaggedPendingRetentionAuditAdjuster implements PendingRetentionAuditFactor {
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

  adjust(item: PendingRetentionAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingRetentionAuditAdjuster implements PendingRetentionAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingRetentionAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingRetentionAuditBudgetOffsetAdjuster implements PendingRetentionAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PendingRetentionAudit, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredPendingRetentionAuditAdjuster implements PendingRetentionAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingRetentionAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingRetentionAuditAdjuster implements PendingRetentionAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingRetentionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending retention audit steps in order and keeps a trace of each. */
export class PendingRetentionAuditEngine {
  steps: PendingRetentionAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRetentionAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingRetentionAudit): number {
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

  evaluateAll(items: PendingRetentionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingRetentionAuditEngine(flagsValue: flags.Registry): PendingRetentionAuditEngine {
  return new PendingRetentionAuditEngine(
    [
      new FlaggedPendingRetentionAuditAdjuster(flagsValue, "pending-retention-audit-weighted", -0.5),
      new RoundingPendingRetentionAuditAdjuster(5),
      new PendingRetentionAuditBudgetOffsetAdjuster(1),
      new TieredPendingRetentionAuditAdjuster([2850, 7636, 8912], [1.18, 0.91, 0.91]),
      new MinimumPendingRetentionAuditAdjuster(30.6),
    ],
    [],
    1.8,
    48250.1,
  );
}
