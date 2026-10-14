import { LenientMentionBudget } from "./lenient-mention-budget.js";

/** A rule a lenient mention budget must pass. Check returns its problems, or none. */
export interface LenientMentionBudgetRule {
  check(item: LenientMentionBudget): string[];
}

export class LenientMentionBudgetCodePrefixRule implements LenientMentionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientMentionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientMentionBudgetArchivedGuardRule implements LenientMentionBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientMentionBudget): string[] {
    if (item.archived && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LenientMentionBudgetFloorValueRangeRule implements LenientMentionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMentionBudget): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient mention budget. */
export class LenientMentionBudgetValidator {
  rules: LenientMentionBudgetRule[];

  constructor(rules: LenientMentionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientMentionBudget): string[] {
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

  requireValid(item: LenientMentionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientMentionBudget[]): Map<string, string[]> {
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

export function defaultLenientMentionBudgetValidator(): LenientMentionBudgetValidator {
  return new LenientMentionBudgetValidator(
    [
      new LenientMentionBudgetCodePrefixRule("X"),
      new LenientMentionBudgetArchivedGuardRule(255),
      new LenientMentionBudgetFloorValueRangeRule(8.7, 4380.2),
    ],
  );
}
