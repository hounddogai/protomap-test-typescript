import * as text from "../../../../kit/text.js";
import { ApprovalPlan } from "./approval-plan.js";

/** A rule a approval plan must pass. Check returns its problems, or none. */
export interface ApprovalPlanRule {
  check(item: ApprovalPlan): string[];
}

export class ApprovalPlanAllowedCohortRule implements ApprovalPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is blocked`];
    return [];
  }
}

export class ApprovalPlanCohortLengthRule implements ApprovalPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalPlan): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalPlanCodeLengthRule implements ApprovalPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalPlanRequiredCodeRule implements ApprovalPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval plan. */
export class ApprovalPlanValidator {
  rules: ApprovalPlanRule[];

  constructor(rules: ApprovalPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalPlan[]): Map<string, string[]> {
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

export function defaultApprovalPlanValidator(): ApprovalPlanValidator {
  return new ApprovalPlanValidator(
    [
      new ApprovalPlanAllowedCohortRule(["global"]),
      new ApprovalPlanCohortLengthRule(32),
      new ApprovalPlanCodeLengthRule(255),
      new ApprovalPlanRequiredCodeRule("approval plan needs an entry"),
    ],
  );
}
