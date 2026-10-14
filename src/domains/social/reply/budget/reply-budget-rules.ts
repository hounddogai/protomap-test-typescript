import { ReplyBudget } from "./reply-budget.js";

/** A rule a reply budget must pass. Check returns its problems, or none. */
export interface ReplyBudgetRule {
  check(item: ReplyBudget): string[];
}

export class ReplyBudgetBatchSizeRangeRule implements ReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyBudget): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyBudgetExpiresAtRangeRule implements ReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyBudget): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyBudgetRequiredLabelRule implements ReplyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyBudgetCodeLengthRule implements ReplyBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply budget. */
export class ReplyBudgetValidator {
  rules: ReplyBudgetRule[];

  constructor(rules: ReplyBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyBudget): string[] {
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

  requireValid(item: ReplyBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyBudget[]): Map<string, string[]> {
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

export function defaultReplyBudgetValidator(): ReplyBudgetValidator {
  return new ReplyBudgetValidator(
    [
      new ReplyBudgetBatchSizeRangeRule(64, 3600),
      new ReplyBudgetExpiresAtRangeRule(32, 255),
      new ReplyBudgetRequiredLabelRule("reply budget needs a value"),
      new ReplyBudgetCodeLengthRule(1000),
    ],
  );
}
