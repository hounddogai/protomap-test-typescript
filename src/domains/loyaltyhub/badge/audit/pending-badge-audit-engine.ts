import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingBadgeAudit } from "./pending-badge-audit.js";

/** One step of the pending badge audit calculation. */
export interface PendingBadgeAuditFactor {
  describe(): string;
  adjust(item: PendingBadgeAudit, value: number): number;
}

export class TitlePendingBadgeAuditAdjuster implements PendingBadgeAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingBadgeAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingBadgeAuditAdjuster implements PendingBadgeAuditFactor {
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

  adjust(item: PendingBadgeAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingBadgeAuditAmountOffsetAdjuster implements PendingBadgeAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: PendingBadgeAudit, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the pending badge audit steps in order and keeps a trace of each. */
export class PendingBadgeAuditEngine {
  steps: PendingBadgeAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBadgeAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingBadgeAudit): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PendingBadgeAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingBadgeAuditEngine(flagsValue: flags.Registry): PendingBadgeAuditEngine {
  return new PendingBadgeAuditEngine(
    [
      new TitlePendingBadgeAuditAdjuster(new Map<string, number>([["east", 1.39]])),
      new FlaggedPendingBadgeAuditAdjuster(flagsValue, "pending-badge-audit-primary", -4.3),
      new PendingBadgeAuditAmountOffsetAdjuster(1.42),
    ],
    [],
    3,
    8834,
  );
}
