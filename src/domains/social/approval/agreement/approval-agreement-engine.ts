import * as flags from "../../../../kit/flags.js";
import { ApprovalAgreement } from "./approval-agreement.js";

/** One step of the approval agreement calculation. */
export interface ApprovalAgreementStep {
  describe(): string;
  adjust(item: ApprovalAgreement, value: number): number;
}

export class FlaggedApprovalAgreementAdjuster implements ApprovalAgreementStep {
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

  adjust(item: ApprovalAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumApprovalAgreementAdjuster implements ApprovalAgreementStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentApprovalAgreementAdjuster implements ApprovalAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ApprovalAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the approval agreement steps in order and keeps a trace of each. */
export class ApprovalAgreementEngine {
  steps: ApprovalAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalAgreement): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ApprovalAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalAgreementEngine(flagsValue: flags.Registry): ApprovalAgreementEngine {
  return new ApprovalAgreementEngine(
    [
      new FlaggedApprovalAgreementAdjuster(flagsValue, "approval-agreement-fallback", -2.3),
      new MinimumApprovalAgreementAdjuster(20.1),
      new SegmentApprovalAgreementAdjuster(new Map<string, number>([["retail", 0.82], ["east", 1.14]])),
    ],
    [],
    0.4,
    62550.1,
  );
}
