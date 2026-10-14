import { WindowBudget } from "./window-budget.js";

/** A rule a window budget must pass. Check returns its problems, or none. */
export interface WindowBudgetRule {
  check(item: WindowBudget): string[];
}

export class WindowBudgetRequiredTitleRule implements WindowBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WindowBudgetCodeLengthRule implements WindowBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowBudgetCodePrefixRule implements WindowBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowBudgetRequiredCodeRule implements WindowBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window budget. */
export class WindowBudgetValidator {
  rules: WindowBudgetRule[];

  constructor(rules: WindowBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WindowBudget): string[] {
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

  requireValid(item: WindowBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowBudget[]): Map<string, string[]> {
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

export function defaultWindowBudgetValidator(): WindowBudgetValidator {
  return new WindowBudgetValidator(
    [
      new WindowBudgetRequiredTitleRule("window budget needs an entry"),
      new WindowBudgetCodeLengthRule(255),
      new WindowBudgetCodePrefixRule("X"),
      new WindowBudgetRequiredCodeRule("window budget needs this field"),
    ],
  );
}
