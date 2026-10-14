import * as numbers from "../../../../kit/numbers.js";
import { ApprovalAudit } from "./approval-audit.js";

/** One step of the approval audit calculation. */
export interface ApprovalAuditModifier {
  describe(): string;
  adjust(item: ApprovalAudit, value: number): number;
}

export class RoundingApprovalAuditAdjuster implements ApprovalAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ApprovalAuditCreatedAtOffsetAdjuster implements ApprovalAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ApprovalAudit, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class NameApprovalAuditAdjuster implements ApprovalAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ApprovalAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumApprovalAuditAdjuster implements ApprovalAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the approval audit steps in order and keeps a trace of each. */
export class ApprovalAuditEngine {
  steps: ApprovalAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalAudit): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ApprovalAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalAuditEngine(): ApprovalAuditEngine {
  return new ApprovalAuditEngine(
    [
      new RoundingApprovalAuditAdjuster(1),
      new ApprovalAuditCreatedAtOffsetAdjuster(1.25),
      new NameApprovalAuditAdjuster(new Map<string, number>([["east", 1.36]])),
      new MinimumApprovalAuditAdjuster(38.4),
    ],
    [],
    0.1,
    44410.2,
  );
}
