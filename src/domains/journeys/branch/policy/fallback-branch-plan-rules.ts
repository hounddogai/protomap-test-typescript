import { FallbackBranchPlan } from "./fallback-branch-plan.js";

/** A rule a fallback branch plan must pass. Check returns its problems, or none. */
export interface FallbackBranchPlanRule {
  check(item: FallbackBranchPlan): string[];
}

export class FallbackBranchPlanRequiredContactEmailRule implements FallbackBranchPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBranchPlan): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBranchPlanCodeLengthRule implements FallbackBranchPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBranchPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBranchPlanCodePrefixRule implements FallbackBranchPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackBranchPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackBranchPlanPinnedGuardRule implements FallbackBranchPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackBranchPlan): string[] {
    if (item.pinned && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class FallbackBranchPlanMinimumRangeRule implements FallbackBranchPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBranchPlan): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback branch plan. */
export class FallbackBranchPlanValidator {
  rules: FallbackBranchPlanRule[];

  constructor(rules: FallbackBranchPlanRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBranchPlan): string[] {
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

  requireValid(item: FallbackBranchPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBranchPlan[]): Map<string, string[]> {
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

export function defaultFallbackBranchPlanValidator(): FallbackBranchPlanValidator {
  return new FallbackBranchPlanValidator(
    [
      new FallbackBranchPlanRequiredContactEmailRule("fallback branch plan needs a value"),
      new FallbackBranchPlanCodeLengthRule(1000),
      new FallbackBranchPlanCodePrefixRule("Q"),
      new FallbackBranchPlanPinnedGuardRule(3.8),
      new FallbackBranchPlanMinimumRangeRule(3.1, 3947),
    ],
  );
}
