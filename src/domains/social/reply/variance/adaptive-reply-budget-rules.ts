import * as text from "../../../../kit/text.js";
import { AdaptiveReplyBudget } from "./adaptive-reply-budget.js";

/** A rule a adaptive reply budget must pass. Check returns its problems, or none. */
export interface AdaptiveReplyBudgetRule {
  check(item: AdaptiveReplyBudget): string[];
}

export class AdaptiveReplyBudgetSequenceRangeRule implements AdaptiveReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveReplyBudget): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveReplyBudgetAllowedSummaryRule implements AdaptiveReplyBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveReplyBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is missing`];
    return [];
  }
}

export class AdaptiveReplyBudgetConversionRateRangeRule implements AdaptiveReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveReplyBudget): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive reply budget. */
export class AdaptiveReplyBudgetValidator {
  rules: AdaptiveReplyBudgetRule[];

  constructor(rules: AdaptiveReplyBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveReplyBudget): string[] {
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

  requireValid(item: AdaptiveReplyBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveReplyBudget[]): Map<string, string[]> {
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

export function defaultAdaptiveReplyBudgetValidator(): AdaptiveReplyBudgetValidator {
  return new AdaptiveReplyBudgetValidator(
    [
      new AdaptiveReplyBudgetSequenceRangeRule(86400, 86400),
      new AdaptiveReplyBudgetAllowedSummaryRule(["manual", "lenient", "weighted"]),
      new AdaptiveReplyBudgetConversionRateRangeRule(5, 1675.5),
    ],
  );
}
