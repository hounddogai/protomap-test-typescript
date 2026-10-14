import * as text from "../../../../kit/text.js";
import { PendingBidRuleBudget } from "./pending-bid-rule-budget.js";

/** A rule a pending bid rule budget must pass. Check returns its problems, or none. */
export interface PendingBidRuleBudgetRule {
  check(item: PendingBidRuleBudget): string[];
}

export class PendingBidRuleBudgetAllowedCodeRule implements PendingBidRuleBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingBidRuleBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class PendingBidRuleBudgetAudienceIdLengthRule implements PendingBidRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRuleBudget): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBidRuleBudgetCodePrefixRule implements PendingBidRuleBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingBidRuleBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending bid rule budget. */
export class PendingBidRuleBudgetValidator {
  rules: PendingBidRuleBudgetRule[];

  constructor(rules: PendingBidRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBidRuleBudget): string[] {
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

  requireValid(item: PendingBidRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBidRuleBudget[]): Map<string, string[]> {
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

export function defaultPendingBidRuleBudgetValidator(): PendingBidRuleBudgetValidator {
  return new PendingBidRuleBudgetValidator(
    [
      new PendingBidRuleBudgetAllowedCodeRule(["rolling", "weighted"]),
      new PendingBidRuleBudgetAudienceIdLengthRule(32),
      new PendingBidRuleBudgetCodePrefixRule("ACM"),
    ],
  );
}
