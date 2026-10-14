import { EnrollmentBudget } from "./enrollment-budget.js";

/** A rule a enrollment budget must pass. Check returns its problems, or none. */
export interface EnrollmentBudgetRule {
  check(item: EnrollmentBudget): string[];
}

export class EnrollmentBudgetRequiredLabelRule implements EnrollmentBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentBudgetActiveGuardRule implements EnrollmentBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentBudget): string[] {
    if (item.active && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while active`];
    return [];
  }
}

export class EnrollmentBudgetCodeLengthRule implements EnrollmentBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentBudgetCodePrefixRule implements EnrollmentBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a enrollment budget. */
export class EnrollmentBudgetValidator {
  rules: EnrollmentBudgetRule[];

  constructor(rules: EnrollmentBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentBudget): string[] {
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

  requireValid(item: EnrollmentBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentBudget[]): Map<string, string[]> {
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

export function defaultEnrollmentBudgetValidator(): EnrollmentBudgetValidator {
  return new EnrollmentBudgetValidator(
    [
      new EnrollmentBudgetRequiredLabelRule("enrollment budget needs this field"),
      new EnrollmentBudgetActiveGuardRule(1000),
      new EnrollmentBudgetCodeLengthRule(16),
      new EnrollmentBudgetCodePrefixRule("OPS"),
    ],
  );
}
