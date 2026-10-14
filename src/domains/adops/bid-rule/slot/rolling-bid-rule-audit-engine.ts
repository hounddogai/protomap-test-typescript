import { RollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

/** One step of the rolling bid rule audit calculation. */
export interface RollingBidRuleAuditModifier {
  describe(): string;
  adjust(item: RollingBidRuleAudit, value: number): number;
}

export class MinimumRollingBidRuleAuditAdjuster implements RollingBidRuleAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingBidRuleAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingBidRuleAuditAdjuster implements RollingBidRuleAuditModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingBidRuleAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RollingBidRuleAuditPriorityOffsetAdjuster implements RollingBidRuleAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: RollingBidRuleAudit, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class SourceRollingBidRuleAuditAdjuster implements RollingBidRuleAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RollingBidRuleAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling bid rule audit steps in order and keeps a trace of each. */
export class RollingBidRuleAuditEngine {
  steps: RollingBidRuleAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingBidRuleAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingBidRuleAudit): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RollingBidRuleAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingBidRuleAuditEngine(): RollingBidRuleAuditEngine {
  return new RollingBidRuleAuditEngine(
    [
      new MinimumRollingBidRuleAuditAdjuster(1),
      new PercentRollingBidRuleAuditAdjuster(13.8),
      new RollingBidRuleAuditPriorityOffsetAdjuster(1.82),
      new SourceRollingBidRuleAuditAdjuster(
        new Map<string, number>([["north", 0.73], ["west", 0.78], ["retail", 1.26]]),
      ),
    ],
    [],
    2.3,
    1971.7,
  );
}
