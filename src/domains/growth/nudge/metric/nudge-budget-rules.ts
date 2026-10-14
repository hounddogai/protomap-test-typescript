import * as text from "../../../../kit/text.js";
import { NudgeBudget } from "./nudge-budget.js";

/** A rule a nudge budget must pass. Check returns its problems, or none. */
export interface NudgeBudgetRule {
  check(item: NudgeBudget): string[];
}

export class NudgeBudgetAllowedLabelRule implements NudgeBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class NudgeBudgetCodeLengthRule implements NudgeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeBudgetLocaleLengthRule implements NudgeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeBudget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeBudgetRequiredCodeRule implements NudgeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge budget. */
export class NudgeBudgetValidator {
  rules: NudgeBudgetRule[];

  constructor(rules: NudgeBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeBudget[]): Map<string, string[]> {
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

export function defaultNudgeBudgetValidator(): NudgeBudgetValidator {
  return new NudgeBudgetValidator(
    [
      new NudgeBudgetAllowedLabelRule([]),
      new NudgeBudgetCodeLengthRule(86400),
      new NudgeBudgetLocaleLengthRule(1000),
      new NudgeBudgetRequiredCodeRule("nudge budget needs a value"),
    ],
  );
}
