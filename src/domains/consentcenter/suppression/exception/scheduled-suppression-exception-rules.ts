import { ScheduledSuppressionException } from "./scheduled-suppression-exception.js";

/** A rule a scheduled suppression exception must pass. Check returns its problems, or none. */
export interface ScheduledSuppressionExceptionRule {
  check(item: ScheduledSuppressionException): string[];
}

export class ScheduledSuppressionExceptionCodePrefixRule implements ScheduledSuppressionExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledSuppressionException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledSuppressionExceptionJourneyIdLengthRule implements ScheduledSuppressionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionException): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSuppressionExceptionNameLengthRule implements ScheduledSuppressionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSuppressionExceptionMarginRangeRule implements ScheduledSuppressionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSuppressionException): string[] {
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

export class ScheduledSuppressionExceptionCodeLengthRule implements ScheduledSuppressionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSuppressionExceptionCurrencyLengthRule implements ScheduledSuppressionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionException): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled suppression exception. */
export class ScheduledSuppressionExceptionValidator {
  rules: ScheduledSuppressionExceptionRule[];

  constructor(rules: ScheduledSuppressionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSuppressionException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledSuppressionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSuppressionException[]): Map<string, string[]> {
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

export function defaultScheduledSuppressionExceptionValidator(): ScheduledSuppressionExceptionValidator {
  return new ScheduledSuppressionExceptionValidator(
    [
      new ScheduledSuppressionExceptionCodePrefixRule("ACM"),
      new ScheduledSuppressionExceptionJourneyIdLengthRule(120),
      new ScheduledSuppressionExceptionNameLengthRule(16),
      new ScheduledSuppressionExceptionMarginRangeRule(6.5, 972.6),
      new ScheduledSuppressionExceptionCodeLengthRule(32),
      new ScheduledSuppressionExceptionCurrencyLengthRule(64),
    ],
  );
}
