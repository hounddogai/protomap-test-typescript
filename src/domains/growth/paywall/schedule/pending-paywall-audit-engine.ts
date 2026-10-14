import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPaywallAudit } from "./pending-paywall-audit.js";

/** One step of the pending paywall audit calculation. */
export interface PendingPaywallAuditAdjuster {
  describe(): string;
  adjust(item: PendingPaywallAudit, value: number): number;
}

export class MinimumPendingPaywallAuditAdjuster implements PendingPaywallAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPaywallAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPendingPaywallAuditAdjuster implements PendingPaywallAuditAdjuster {
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

  adjust(item: PendingPaywallAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourcePendingPaywallAuditAdjuster implements PendingPaywallAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PendingPaywallAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPendingPaywallAuditAdjuster implements PendingPaywallAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingPaywallAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPendingPaywallAuditAdjuster implements PendingPaywallAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingPaywallAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending paywall audit steps in order and keeps a trace of each. */
export class PendingPaywallAuditEngine {
  steps: PendingPaywallAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPaywallAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingPaywallAudit): number {
    let current = item.projectedValue();
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

  evaluateAll(items: PendingPaywallAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingPaywallAuditEngine(flagsValue: flags.Registry): PendingPaywallAuditEngine {
  return new PendingPaywallAuditEngine(
    [
      new MinimumPendingPaywallAuditAdjuster(15.7),
      new FlaggedPendingPaywallAuditAdjuster(flagsValue, "pending-paywall-audit-scheduled", 1.4),
      new SourcePendingPaywallAuditAdjuster(new Map<string, number>([["central", 1.01], ["south", 1.11]])),
      new RoundingPendingPaywallAuditAdjuster(5),
      new PercentPendingPaywallAuditAdjuster(-8.8),
    ],
    [],
    4,
    18544.3,
  );
}
