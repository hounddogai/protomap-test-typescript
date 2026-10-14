import * as text from "../../../../kit/text.js";
import { FraudCheckBundle } from "./fraud-check-bundle.js";

/** A rule a fraud check bundle must pass. Check returns its problems, or none. */
export interface FraudCheckBundleRule {
  check(item: FraudCheckBundle): string[];
}

export class FraudCheckBundleRequiredCodeRule implements FraudCheckBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckBundleTitleLengthRule implements FraudCheckBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckBundleCodeLengthRule implements FraudCheckBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckBundleAllowedTitleRule implements FraudCheckBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class FraudCheckBundleArchivedGuardRule implements FraudCheckBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FraudCheckBundle): string[] {
    if (item.archived && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class FraudCheckBundleLimitRangeRule implements FraudCheckBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckBundle): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fraud check bundle. */
export class FraudCheckBundleValidator {
  rules: FraudCheckBundleRule[];

  constructor(rules: FraudCheckBundleRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckBundle[]): Map<string, string[]> {
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

export function defaultFraudCheckBundleValidator(): FraudCheckBundleValidator {
  return new FraudCheckBundleValidator(
    [
      new FraudCheckBundleRequiredCodeRule("fraud check bundle needs an entry"),
      new FraudCheckBundleTitleLengthRule(16),
      new FraudCheckBundleCodeLengthRule(120),
      new FraudCheckBundleAllowedTitleRule(["pending"]),
      new FraudCheckBundleArchivedGuardRule(16),
      new FraudCheckBundleLimitRangeRule(255, 255),
    ],
  );
}
