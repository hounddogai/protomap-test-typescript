import { LegacyRewardRuleException } from "./legacy-reward-rule-exception.js";

/** A rule a legacy reward rule exception must pass. Check returns its problems, or none. */
export interface LegacyRewardRuleExceptionRule {
  check(item: LegacyRewardRuleException): string[];
}

export class LegacyRewardRuleExceptionMarginRangeRule implements LegacyRewardRuleExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRewardRuleException): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyRewardRuleExceptionCodeLengthRule implements LegacyRewardRuleExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRewardRuleException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyRewardRuleExceptionActiveGuardRule implements LegacyRewardRuleExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyRewardRuleException): string[] {
    if (item.active && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while active`];
    return [];
  }
}

export class LegacyRewardRuleExceptionBudgetRangeRule implements LegacyRewardRuleExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRewardRuleException): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyRewardRuleExceptionRequiredNotesRule implements LegacyRewardRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRewardRuleException): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy reward rule exception. */
export class LegacyRewardRuleExceptionValidator {
  rules: LegacyRewardRuleExceptionRule[];

  constructor(rules: LegacyRewardRuleExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRewardRuleException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyRewardRuleException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRewardRuleException[]): Map<string, string[]> {
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

export function defaultLegacyRewardRuleExceptionValidator(): LegacyRewardRuleExceptionValidator {
  return new LegacyRewardRuleExceptionValidator(
    [
      new LegacyRewardRuleExceptionMarginRangeRule(1.5, 2890.4),
      new LegacyRewardRuleExceptionCodeLengthRule(80),
      new LegacyRewardRuleExceptionActiveGuardRule(7.8),
      new LegacyRewardRuleExceptionBudgetRangeRule(4.9, 1295.6),
      new LegacyRewardRuleExceptionRequiredNotesRule("legacy reward rule exception needs an entry"),
    ],
  );
}
