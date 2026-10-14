import { LenientApprovalPlan } from "./lenient-approval-plan.js";

/** A rule a lenient approval plan must pass. Check returns its problems, or none. */
export interface LenientApprovalPlanRule {
  check(item: LenientApprovalPlan): string[];
}

export class LenientApprovalPlanSendAtRangeRule implements LenientApprovalPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientApprovalPlan): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientApprovalPlanThresholdRangeRule implements LenientApprovalPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientApprovalPlan): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientApprovalPlanRatioRangeRule implements LenientApprovalPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientApprovalPlan): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientApprovalPlanCodeLengthRule implements LenientApprovalPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientApprovalPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient approval plan. */
export class LenientApprovalPlanValidator {
  rules: LenientApprovalPlanRule[];

  constructor(rules: LenientApprovalPlanRule[]) {
    this.rules = rules;
  }

  validate(item: LenientApprovalPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientApprovalPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientApprovalPlan[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultLenientApprovalPlanValidator(): LenientApprovalPlanValidator {
  return new LenientApprovalPlanValidator(
    [
      new LenientApprovalPlanSendAtRangeRule(80, 3600),
      new LenientApprovalPlanThresholdRangeRule(1.9, 1409.7),
      new LenientApprovalPlanRatioRangeRule(7.3, 4665.1),
      new LenientApprovalPlanCodeLengthRule(80),
    ],
  );
}
