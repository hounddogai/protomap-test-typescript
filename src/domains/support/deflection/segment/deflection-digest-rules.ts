import * as text from "../../../../kit/text.js";
import { DeflectionDigest } from "./deflection-digest.js";

/** A rule a deflection digest must pass. Check returns its problems, or none. */
export interface DeflectionDigestRule {
  check(item: DeflectionDigest): string[];
}

export class DeflectionDigestBudgetRangeRule implements DeflectionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionDigest): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionDigestOwnerIdLengthRule implements DeflectionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionDigest): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionDigestAllowedCodeRule implements DeflectionDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class DeflectionDigestStartsAtRangeRule implements DeflectionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionDigest): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionDigestUtmSourceLengthRule implements DeflectionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionDigest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection digest. */
export class DeflectionDigestValidator {
  rules: DeflectionDigestRule[];

  constructor(rules: DeflectionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionDigest): string[] {
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

  requireValid(item: DeflectionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionDigest[]): Map<string, string[]> {
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

export function defaultDeflectionDigestValidator(): DeflectionDigestValidator {
  return new DeflectionDigestValidator(
    [
      new DeflectionDigestBudgetRangeRule(5.6, 129.5),
      new DeflectionDigestOwnerIdLengthRule(120),
      new DeflectionDigestAllowedCodeRule(["regional"]),
      new DeflectionDigestStartsAtRangeRule(64, 1000),
      new DeflectionDigestUtmSourceLengthRule(3600),
    ],
  );
}
