import { ManualPostBudget } from "./manual-post-budget.js";

/** A rule a manual post budget must pass. Check returns its problems, or none. */
export interface ManualPostBudgetRule {
  check(item: ManualPostBudget): string[];
}

export class ManualPostBudgetRequiredLocaleRule implements ManualPostBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPostBudget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPostBudgetRequiredCodeRule implements ManualPostBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPostBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPostBudgetRequiredNameRule implements ManualPostBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPostBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPostBudgetNameLengthRule implements ManualPostBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPostBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPostBudgetLocaleLengthRule implements ManualPostBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPostBudget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual post budget. */
export class ManualPostBudgetValidator {
  rules: ManualPostBudgetRule[];

  constructor(rules: ManualPostBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPostBudget): string[] {
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

  requireValid(item: ManualPostBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPostBudget[]): Map<string, string[]> {
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

export function defaultManualPostBudgetValidator(): ManualPostBudgetValidator {
  return new ManualPostBudgetValidator(
    [
      new ManualPostBudgetRequiredLocaleRule("manual post budget needs this field"),
      new ManualPostBudgetRequiredCodeRule("manual post budget needs this field"),
      new ManualPostBudgetRequiredNameRule("manual post budget needs an entry"),
      new ManualPostBudgetNameLengthRule(120),
      new ManualPostBudgetLocaleLengthRule(120),
    ],
  );
}
