import { BranchPlan } from "./branch-plan.js";

/** A rule a branch plan must pass. Check returns its problems, or none. */
export interface BranchPlanRule {
  check(item: BranchPlan): string[];
}

export class BranchPlanRequiredTitleRule implements BranchPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BranchPlanRequiredVariantRule implements BranchPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchPlan): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class BranchPlanLabelLengthRule implements BranchPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch plan. */
export class BranchPlanValidator {
  rules: BranchPlanRule[];

  constructor(rules: BranchPlanRule[]) {
    this.rules = rules;
  }

  validate(item: BranchPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchPlan[]): Map<string, string[]> {
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

export function defaultBranchPlanValidator(): BranchPlanValidator {
  return new BranchPlanValidator(
    [
      new BranchPlanRequiredTitleRule("branch plan needs an entry"),
      new BranchPlanRequiredVariantRule("branch plan needs this field"),
      new BranchPlanLabelLengthRule(120),
    ],
  );
}
