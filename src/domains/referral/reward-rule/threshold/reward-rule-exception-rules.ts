import { RewardRuleException } from "./reward-rule-exception.js";

/** A rule a reward rule exception must pass. Check returns its problems, or none. */
export interface RewardRuleExceptionRule {
  check(item: RewardRuleException): string[];
}

export class RewardRuleExceptionRequiredVariantRule implements RewardRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleException): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleExceptionWindowDaysRangeRule implements RewardRuleExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleException): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleExceptionPinnedGuardRule implements RewardRuleExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardRuleException): string[] {
    if (item.pinned && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RewardRuleExceptionNameLengthRule implements RewardRuleExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleExceptionQuantityRangeRule implements RewardRuleExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleException): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleExceptionRequiredLabelRule implements RewardRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule exception. */
export class RewardRuleExceptionValidator {
  rules: RewardRuleExceptionRule[];

  constructor(rules: RewardRuleExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleException[]): Map<string, string[]> {
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

export function defaultRewardRuleExceptionValidator(): RewardRuleExceptionValidator {
  return new RewardRuleExceptionValidator(
    [
      new RewardRuleExceptionRequiredVariantRule("reward rule exception needs this field"),
      new RewardRuleExceptionWindowDaysRangeRule(32, 3600),
      new RewardRuleExceptionPinnedGuardRule(86400),
      new RewardRuleExceptionNameLengthRule(32),
      new RewardRuleExceptionQuantityRangeRule(80, 86400),
      new RewardRuleExceptionRequiredLabelRule("reward rule exception needs an entry"),
    ],
  );
}
