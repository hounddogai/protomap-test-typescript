import { DeflectionNotice } from "./deflection-notice.js";

/** A rule a deflection notice must pass. Check returns its problems, or none. */
export interface DeflectionNoticeRule {
  check(item: DeflectionNotice): string[];
}

export class DeflectionNoticeRequiredNameRule implements DeflectionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionNoticeCreatedAtRangeRule implements DeflectionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionNotice): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionNoticeExternalRefLengthRule implements DeflectionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionNotice): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionNoticeGraceDaysRangeRule implements DeflectionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionNotice): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a deflection notice. */
export class DeflectionNoticeValidator {
  rules: DeflectionNoticeRule[];

  constructor(rules: DeflectionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionNotice[]): Map<string, string[]> {
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

export function defaultDeflectionNoticeValidator(): DeflectionNoticeValidator {
  return new DeflectionNoticeValidator(
    [
      new DeflectionNoticeRequiredNameRule("deflection notice needs a value"),
      new DeflectionNoticeCreatedAtRangeRule(3600, 3600),
      new DeflectionNoticeExternalRefLengthRule(16),
      new DeflectionNoticeGraceDaysRangeRule(80, 120),
    ],
  );
}
