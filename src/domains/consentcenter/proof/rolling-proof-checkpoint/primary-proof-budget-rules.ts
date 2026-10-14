import { PrimaryProofBudget } from "./primary-proof-budget.js";

/** A rule a primary proof budget must pass. Check returns its problems, or none. */
export interface PrimaryProofBudgetRule {
  check(item: PrimaryProofBudget): string[];
}

export class PrimaryProofBudgetArchivedGuardRule implements PrimaryProofBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryProofBudget): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PrimaryProofBudgetCampaignRefLengthRule implements PrimaryProofBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryProofBudget): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryProofBudgetBudgetRangeRule implements PrimaryProofBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryProofBudget): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryProofBudgetRequiredCodeRule implements PrimaryProofBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryProofBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryProofBudgetRequiredCampaignRefRule implements PrimaryProofBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryProofBudget): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryProofBudgetNameLengthRule implements PrimaryProofBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryProofBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary proof budget. */
export class PrimaryProofBudgetValidator {
  rules: PrimaryProofBudgetRule[];

  constructor(rules: PrimaryProofBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryProofBudget): string[] {
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

  requireValid(item: PrimaryProofBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryProofBudget[]): Map<string, string[]> {
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

export function defaultPrimaryProofBudgetValidator(): PrimaryProofBudgetValidator {
  return new PrimaryProofBudgetValidator(
    [
      new PrimaryProofBudgetArchivedGuardRule(2.8),
      new PrimaryProofBudgetCampaignRefLengthRule(3600),
      new PrimaryProofBudgetBudgetRangeRule(8.9, 651.4),
      new PrimaryProofBudgetRequiredCodeRule("primary proof budget needs this field"),
      new PrimaryProofBudgetRequiredCampaignRefRule("primary proof budget needs a value"),
      new PrimaryProofBudgetNameLengthRule(255),
    ],
  );
}
