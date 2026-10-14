import * as text from "../../../../kit/text.js";
import { PaywallBudget } from "./paywall-budget.js";

/** A rule a paywall budget must pass. Check returns its problems, or none. */
export interface PaywallBudgetRule {
  check(item: PaywallBudget): string[];
}

export class PaywallBudgetGraceDaysRangeRule implements PaywallBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallBudget): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallBudgetRequiredLabelRule implements PaywallBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallBudgetBatchSizeRangeRule implements PaywallBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallBudget): string[] {
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

export class PaywallBudgetAllowedExternalRefRule implements PaywallBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is below minimum`];
    return [];
  }
}

export class PaywallBudgetScoreRangeRule implements PaywallBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallBudget): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallBudgetRequiredAudienceIdRule implements PaywallBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallBudget): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall budget. */
export class PaywallBudgetValidator {
  rules: PaywallBudgetRule[];

  constructor(rules: PaywallBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallBudget): string[] {
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

  requireValid(item: PaywallBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallBudget[]): Map<string, string[]> {
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

export function defaultPaywallBudgetValidator(): PaywallBudgetValidator {
  return new PaywallBudgetValidator(
    [
      new PaywallBudgetGraceDaysRangeRule(32, 86400),
      new PaywallBudgetRequiredLabelRule("paywall budget needs an entry"),
      new PaywallBudgetBatchSizeRangeRule(16, 120),
      new PaywallBudgetAllowedExternalRefRule([]),
      new PaywallBudgetScoreRangeRule(4.7, 4426.8),
      new PaywallBudgetRequiredAudienceIdRule("paywall budget needs a value"),
    ],
  );
}
