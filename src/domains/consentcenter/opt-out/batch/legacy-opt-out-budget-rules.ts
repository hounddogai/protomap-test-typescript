import * as text from "../../../../kit/text.js";
import { LegacyOptOutBudget } from "./legacy-opt-out-budget.js";

/** A rule a legacy opt out budget must pass. Check returns its problems, or none. */
export interface LegacyOptOutBudgetRule {
  check(item: LegacyOptOutBudget): string[];
}

export class LegacyOptOutBudgetAllowedNameRule implements LegacyOptOutBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyOptOutBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class LegacyOptOutBudgetBidRangeRule implements LegacyOptOutBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyOptOutBudget): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyOptOutBudgetNameLengthRule implements LegacyOptOutBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyOptOutBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyOptOutBudgetOwnerIdLengthRule implements LegacyOptOutBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyOptOutBudget): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy opt out budget. */
export class LegacyOptOutBudgetValidator {
  rules: LegacyOptOutBudgetRule[];

  constructor(rules: LegacyOptOutBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyOptOutBudget): string[] {
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

  requireValid(item: LegacyOptOutBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyOptOutBudget[]): Map<string, string[]> {
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

export function defaultLegacyOptOutBudgetValidator(): LegacyOptOutBudgetValidator {
  return new LegacyOptOutBudgetValidator(
    [
      new LegacyOptOutBudgetAllowedNameRule(["batched"]),
      new LegacyOptOutBudgetBidRangeRule(8.3, 879.6),
      new LegacyOptOutBudgetNameLengthRule(16),
      new LegacyOptOutBudgetOwnerIdLengthRule(1000),
    ],
  );
}
