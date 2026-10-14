import { RewardException } from "./reward-exception.js";

/** A rule a reward exception must pass. Check returns its problems, or none. */
export interface RewardExceptionRule {
  check(item: RewardException): string[];
}

export class RewardExceptionPhoneLengthRule implements RewardExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardException): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardExceptionCodePrefixRule implements RewardExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardExceptionStartsAtRangeRule implements RewardExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardException): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward exception. */
export class RewardExceptionValidator {
  rules: RewardExceptionRule[];

  constructor(rules: RewardExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: RewardException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardException[]): Map<string, string[]> {
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

export function defaultRewardExceptionValidator(): RewardExceptionValidator {
  return new RewardExceptionValidator(
    [
      new RewardExceptionPhoneLengthRule(86400),
      new RewardExceptionCodePrefixRule("X"),
      new RewardExceptionStartsAtRangeRule(32, 80),
    ],
  );
}
