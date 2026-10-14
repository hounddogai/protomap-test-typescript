import { CappedBranchPlan } from "./capped-branch-plan.js";

/** A rule a capped branch plan must pass. Check returns its problems, or none. */
export interface CappedBranchPlanRule {
  check(item: CappedBranchPlan): string[];
}

export class CappedBranchPlanCodeLengthRule implements CappedBranchPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBranchPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBranchPlanBudgetRangeRule implements CappedBranchPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBranchPlan): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedBranchPlanUtmSourceLengthRule implements CappedBranchPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBranchPlan): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBranchPlanRequiredNameRule implements CappedBranchPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBranchPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBranchPlanRequiredCodeRule implements CappedBranchPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBranchPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBranchPlanRequiredUtmSourceRule implements CappedBranchPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBranchPlan): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped branch plan. */
export class CappedBranchPlanValidator {
  rules: CappedBranchPlanRule[];

  constructor(rules: CappedBranchPlanRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBranchPlan): string[] {
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

  requireValid(item: CappedBranchPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBranchPlan[]): Map<string, string[]> {
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

export function defaultCappedBranchPlanValidator(): CappedBranchPlanValidator {
  return new CappedBranchPlanValidator(
    [
      new CappedBranchPlanCodeLengthRule(3600),
      new CappedBranchPlanBudgetRangeRule(2.2, 424.6),
      new CappedBranchPlanUtmSourceLengthRule(120),
      new CappedBranchPlanRequiredNameRule("capped branch plan needs this field"),
      new CappedBranchPlanRequiredCodeRule("capped branch plan needs this field"),
      new CappedBranchPlanRequiredUtmSourceRule("capped branch plan needs this field"),
    ],
  );
}
