import * as numbers from "../../../../kit/numbers.js";
import { PendingApprovalAudit } from "./pending-approval-audit.js";

/** One step of the pending approval audit calculation. */
export interface PendingApprovalAuditFactor {
  describe(): string;
  adjust(item: PendingApprovalAudit, value: number): number;
}

export class RoundingPendingApprovalAuditAdjuster implements PendingApprovalAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingApprovalAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentPendingApprovalAuditAdjuster implements PendingApprovalAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PendingApprovalAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingApprovalAuditAdjuster implements PendingApprovalAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingApprovalAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending approval audit steps in order and keeps a trace of each. */
export class PendingApprovalAuditEngine {
  steps: PendingApprovalAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingApprovalAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingApprovalAudit): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: PendingApprovalAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingApprovalAuditEngine(): PendingApprovalAuditEngine {
  return new PendingApprovalAuditEngine(
    [
      new RoundingPendingApprovalAuditAdjuster(0.05),
      new SegmentPendingApprovalAuditAdjuster(new Map<string, number>([["north", 0.81]])),
      new PercentPendingApprovalAuditAdjuster(14.9),
    ],
    [],
    4.6,
    55790.7,
  );
}
