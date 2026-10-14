import { BadgeException } from "./badge-exception.js";

/** A rule a badge exception must pass. Check returns its problems, or none. */
export interface BadgeExceptionRule {
  check(item: BadgeException): string[];
}

export class BadgeExceptionRequiredSummaryRule implements BadgeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeException): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeExceptionWindowDaysRangeRule implements BadgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeException): string[] {
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

export class BadgeExceptionTitleLengthRule implements BadgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeExceptionSummaryLengthRule implements BadgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeException): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeExceptionCodePrefixRule implements BadgeExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a badge exception. */
export class BadgeExceptionValidator {
  rules: BadgeExceptionRule[];

  constructor(rules: BadgeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeException): string[] {
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

  requireValid(item: BadgeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeException[]): Map<string, string[]> {
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

export function defaultBadgeExceptionValidator(): BadgeExceptionValidator {
  return new BadgeExceptionValidator(
    [
      new BadgeExceptionRequiredSummaryRule("badge exception needs an entry"),
      new BadgeExceptionWindowDaysRangeRule(80, 3600),
      new BadgeExceptionTitleLengthRule(86400),
      new BadgeExceptionSummaryLengthRule(3600),
      new BadgeExceptionCodePrefixRule("ACM"),
    ],
  );
}
