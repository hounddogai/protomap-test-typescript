import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalTier } from "./approval-tier.js";

/** One step of the approval tier calculation. */
export interface ApprovalTierAdjuster {
  describe(): string;
  adjust(item: ApprovalTier, value: number): number;
}

export class FlaggedApprovalTierAdjuster implements ApprovalTierAdjuster {
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

  adjust(item: ApprovalTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentApprovalTierAdjuster implements ApprovalTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingApprovalTierAdjuster implements ApprovalTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceApprovalTierAdjuster implements ApprovalTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ApprovalTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapApprovalTierAdjuster implements ApprovalTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the approval tier steps in order and keeps a trace of each. */
export class ApprovalTierEngine {
  steps: ApprovalTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalTier): number {
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

  evaluateAll(items: ApprovalTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalTierEngine(flagsValue: flags.Registry): ApprovalTierEngine {
  return new ApprovalTierEngine(
    [
      new FlaggedApprovalTierAdjuster(flagsValue, "approval-tier-seasonal", -8.7),
      new PercentApprovalTierAdjuster(11.6),
      new RoundingApprovalTierAdjuster(0.1),
      new SourceApprovalTierAdjuster(new Map<string, number>([["retail", 1.05], ["east", 1.39]])),
      new CapApprovalTierAdjuster(24839),
    ],
    [],
    2.8,
    94485.4,
  );
}
