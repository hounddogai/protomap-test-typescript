import * as text from "../../../../kit/text.js";
import { TieredRetentionBudget } from "./tiered-retention-budget.js";

/** A rule a tiered retention budget must pass. Check returns its problems, or none. */
export interface TieredRetentionBudgetRule {
  check(item: TieredRetentionBudget): string[];
}

export class TieredRetentionBudgetCampaignRefLengthRule implements TieredRetentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRetentionBudget): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRetentionBudgetCodeLengthRule implements TieredRetentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRetentionBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRetentionBudgetAllowedLabelRule implements TieredRetentionBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredRetentionBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class TieredRetentionBudgetRequiredCodeRule implements TieredRetentionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRetentionBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRetentionBudgetRequiredChannelRule implements TieredRetentionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRetentionBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered retention budget. */
export class TieredRetentionBudgetValidator {
  rules: TieredRetentionBudgetRule[];

  constructor(rules: TieredRetentionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRetentionBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRetentionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRetentionBudget[]): Map<string, string[]> {
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

export function defaultTieredRetentionBudgetValidator(): TieredRetentionBudgetValidator {
  return new TieredRetentionBudgetValidator(
    [
      new TieredRetentionBudgetCampaignRefLengthRule(32),
      new TieredRetentionBudgetCodeLengthRule(255),
      new TieredRetentionBudgetAllowedLabelRule(["default", "weighted"]),
      new TieredRetentionBudgetRequiredCodeRule("tiered retention budget needs an entry"),
      new TieredRetentionBudgetRequiredChannelRule("tiered retention budget needs an entry"),
    ],
  );
}
