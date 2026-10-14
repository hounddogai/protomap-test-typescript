import * as text from "../../../../kit/text.js";
import { RedemptionException } from "./redemption-exception.js";

/** A rule a redemption exception must pass. Check returns its problems, or none. */
export interface RedemptionExceptionRule {
  check(item: RedemptionException): string[];
}

export class RedemptionExceptionWindowDaysRangeRule implements RedemptionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionException): string[] {
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

export class RedemptionExceptionSourceLengthRule implements RedemptionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionException): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionExceptionVersionRangeRule implements RedemptionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionException): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionExceptionAllowedCodeRule implements RedemptionExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a redemption exception. */
export class RedemptionExceptionValidator {
  rules: RedemptionExceptionRule[];

  constructor(rules: RedemptionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionException[]): Map<string, string[]> {
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

export function defaultRedemptionExceptionValidator(): RedemptionExceptionValidator {
  return new RedemptionExceptionValidator(
    [
      new RedemptionExceptionWindowDaysRangeRule(80, 86400),
      new RedemptionExceptionSourceLengthRule(64),
      new RedemptionExceptionVersionRangeRule(1000, 3600),
      new RedemptionExceptionAllowedCodeRule(["legacy"]),
    ],
  );
}
