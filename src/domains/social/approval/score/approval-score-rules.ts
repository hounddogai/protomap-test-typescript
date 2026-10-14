import * as text from "../../../../kit/text.js";
import { ApprovalScore } from "./approval-score.js";

/** A rule a approval score must pass. Check returns its problems, or none. */
export interface ApprovalScoreRule {
  check(item: ApprovalScore): string[];
}

export class ApprovalScoreAmountRangeRule implements ApprovalScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalScore): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalScoreAllowedLocaleRule implements ApprovalScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is above maximum`];
    return [];
  }
}

export class ApprovalScoreRequiredTitleRule implements ApprovalScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval score. */
export class ApprovalScoreValidator {
  rules: ApprovalScoreRule[];

  constructor(rules: ApprovalScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalScore[]): Map<string, string[]> {
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

export function defaultApprovalScoreValidator(): ApprovalScoreValidator {
  return new ApprovalScoreValidator(
    [
      new ApprovalScoreAmountRangeRule(1.6, 3019.6),
      new ApprovalScoreAllowedLocaleRule(["fallback", "legacy"]),
      new ApprovalScoreRequiredTitleRule("approval score needs this field"),
    ],
  );
}
