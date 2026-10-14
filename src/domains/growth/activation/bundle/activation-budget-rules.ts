import * as text from "../../../../kit/text.js";
import { ActivationBudget } from "./activation-budget.js";

/** A rule a activation budget must pass. Check returns its problems, or none. */
export interface ActivationBudgetRule {
  check(item: ActivationBudget): string[];
}

export class ActivationBudgetRequiredTitleRule implements ActivationBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationBudgetCeilingRangeRule implements ActivationBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationBudget): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationBudgetCodePrefixRule implements ActivationBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationBudgetAllowedCodeRule implements ActivationBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class ActivationBudgetCodeLengthRule implements ActivationBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationBudgetRequiredCodeRule implements ActivationBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation budget. */
export class ActivationBudgetValidator {
  rules: ActivationBudgetRule[];

  constructor(rules: ActivationBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationBudget[]): Map<string, string[]> {
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

export function defaultActivationBudgetValidator(): ActivationBudgetValidator {
  return new ActivationBudgetValidator(
    [
      new ActivationBudgetRequiredTitleRule("activation budget needs this field"),
      new ActivationBudgetCeilingRangeRule(5.4, 2659.5),
      new ActivationBudgetCodePrefixRule("ACM"),
      new ActivationBudgetAllowedCodeRule(["legacy", "manual", "legacy"]),
      new ActivationBudgetCodeLengthRule(3600),
      new ActivationBudgetRequiredCodeRule("activation budget needs a value"),
    ],
  );
}
