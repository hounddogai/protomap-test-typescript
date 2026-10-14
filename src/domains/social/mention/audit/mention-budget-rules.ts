import { MentionBudget } from "./mention-budget.js";

/** A rule a mention budget must pass. Check returns its problems, or none. */
export interface MentionBudgetRule {
  check(item: MentionBudget): string[];
}

export class MentionBudgetRequiredLabelRule implements MentionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class MentionBudgetLocaleLengthRule implements MentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionBudget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionBudgetCodeLengthRule implements MentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionBudgetCodePrefixRule implements MentionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionBudgetLabelLengthRule implements MentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionBudgetSummaryLengthRule implements MentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionBudget): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention budget. */
export class MentionBudgetValidator {
  rules: MentionBudgetRule[];

  constructor(rules: MentionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: MentionBudget): string[] {
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

  requireValid(item: MentionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionBudget[]): Map<string, string[]> {
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

export function defaultMentionBudgetValidator(): MentionBudgetValidator {
  return new MentionBudgetValidator(
    [
      new MentionBudgetRequiredLabelRule("mention budget needs this field"),
      new MentionBudgetLocaleLengthRule(255),
      new MentionBudgetCodeLengthRule(1000),
      new MentionBudgetCodePrefixRule("ACM"),
      new MentionBudgetLabelLengthRule(120),
      new MentionBudgetSummaryLengthRule(3600),
    ],
  );
}
