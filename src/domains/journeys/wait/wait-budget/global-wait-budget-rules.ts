import { GlobalWaitBudget } from "./global-wait-budget.js";

/** A rule a global wait budget must pass. Check returns its problems, or none. */
export interface GlobalWaitBudgetRule {
  check(item: GlobalWaitBudget): string[];
}

export class GlobalWaitBudgetLabelLengthRule implements GlobalWaitBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWaitBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWaitBudgetVisibleGuardRule implements GlobalWaitBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalWaitBudget): string[] {
    if (item.visible && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class GlobalWaitBudgetRequiredCodeRule implements GlobalWaitBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWaitBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalWaitBudgetCodeLengthRule implements GlobalWaitBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWaitBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWaitBudgetRequiredExternalRefRule implements GlobalWaitBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWaitBudget): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalWaitBudgetExternalRefLengthRule implements GlobalWaitBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWaitBudget): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global wait budget. */
export class GlobalWaitBudgetValidator {
  rules: GlobalWaitBudgetRule[];

  constructor(rules: GlobalWaitBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalWaitBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalWaitBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalWaitBudget[]): Map<string, string[]> {
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

export function defaultGlobalWaitBudgetValidator(): GlobalWaitBudgetValidator {
  return new GlobalWaitBudgetValidator(
    [
      new GlobalWaitBudgetLabelLengthRule(80),
      new GlobalWaitBudgetVisibleGuardRule(1000),
      new GlobalWaitBudgetRequiredCodeRule("global wait budget needs an entry"),
      new GlobalWaitBudgetCodeLengthRule(255),
      new GlobalWaitBudgetRequiredExternalRefRule("global wait budget needs an entry"),
      new GlobalWaitBudgetExternalRefLengthRule(16),
    ],
  );
}
