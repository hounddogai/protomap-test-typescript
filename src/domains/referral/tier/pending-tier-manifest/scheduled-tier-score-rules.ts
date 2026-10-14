import { ScheduledTierScore } from "./scheduled-tier-score.js";

/** A rule a scheduled tier score must pass. Check returns its problems, or none. */
export interface ScheduledTierScoreRule {
  check(item: ScheduledTierScore): string[];
}

export class ScheduledTierScoreCodeLengthRule implements ScheduledTierScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTierScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTierScoreTimezoneLengthRule implements ScheduledTierScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTierScore): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTierScoreCodePrefixRule implements ScheduledTierScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledTierScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledTierScoreAmountRangeRule implements ScheduledTierScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTierScore): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledTierScoreRequiredCodeRule implements ScheduledTierScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTierScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled tier score. */
export class ScheduledTierScoreValidator {
  rules: ScheduledTierScoreRule[];

  constructor(rules: ScheduledTierScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledTierScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledTierScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledTierScore[]): Map<string, string[]> {
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

export function defaultScheduledTierScoreValidator(): ScheduledTierScoreValidator {
  return new ScheduledTierScoreValidator(
    [
      new ScheduledTierScoreCodeLengthRule(120),
      new ScheduledTierScoreTimezoneLengthRule(86400),
      new ScheduledTierScoreCodePrefixRule("X"),
      new ScheduledTierScoreAmountRangeRule(4.5, 1961),
      new ScheduledTierScoreRequiredCodeRule("scheduled tier score needs this field"),
    ],
  );
}
