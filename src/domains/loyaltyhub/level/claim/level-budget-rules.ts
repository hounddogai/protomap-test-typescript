import * as text from "../../../../kit/text.js";
import { LevelBudget } from "./level-budget.js";

/** A rule a level budget must pass. Check returns its problems, or none. */
export interface LevelBudgetRule {
  check(item: LevelBudget): string[];
}

export class LevelBudgetAllowedExternalRefRule implements LevelBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

export class LevelBudgetTitleLengthRule implements LevelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelBudgetCodePrefixRule implements LevelBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a level budget. */
export class LevelBudgetValidator {
  rules: LevelBudgetRule[];

  constructor(rules: LevelBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LevelBudget): string[] {
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

  requireValid(item: LevelBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelBudget[]): Map<string, string[]> {
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

export function defaultLevelBudgetValidator(): LevelBudgetValidator {
  return new LevelBudgetValidator(
    [
      new LevelBudgetAllowedExternalRefRule(["rolling"]),
      new LevelBudgetTitleLengthRule(86400),
      new LevelBudgetCodePrefixRule("Q"),
    ],
  );
}
