import * as text from "../../../../kit/text.js";
import { PrimaryReplyBudget } from "./primary-reply-budget.js";

/** A rule a primary reply budget must pass. Check returns its problems, or none. */
export interface PrimaryReplyBudgetRule {
  check(item: PrimaryReplyBudget): string[];
}

export class PrimaryReplyBudgetTitleLengthRule implements PrimaryReplyBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryReplyBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryReplyBudgetRequiredTitleRule implements PrimaryReplyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryReplyBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryReplyBudgetAllowedCodeRule implements PrimaryReplyBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryReplyBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class PrimaryReplyBudgetRequiredCodeRule implements PrimaryReplyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryReplyBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryReplyBudgetCodePrefixRule implements PrimaryReplyBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryReplyBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary reply budget. */
export class PrimaryReplyBudgetValidator {
  rules: PrimaryReplyBudgetRule[];

  constructor(rules: PrimaryReplyBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryReplyBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryReplyBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryReplyBudget[]): Map<string, string[]> {
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

export function defaultPrimaryReplyBudgetValidator(): PrimaryReplyBudgetValidator {
  return new PrimaryReplyBudgetValidator(
    [
      new PrimaryReplyBudgetTitleLengthRule(32),
      new PrimaryReplyBudgetRequiredTitleRule("primary reply budget needs a value"),
      new PrimaryReplyBudgetAllowedCodeRule(["fallback", "regional"]),
      new PrimaryReplyBudgetRequiredCodeRule("primary reply budget needs a value"),
      new PrimaryReplyBudgetCodePrefixRule("Q"),
    ],
  );
}
