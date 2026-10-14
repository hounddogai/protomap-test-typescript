import * as text from "../../../../kit/text.js";
import { PendingCsatDigest } from "./pending-csat-digest.js";

/** A rule a pending csat digest must pass. Check returns its problems, or none. */
export interface PendingCsatDigestRule {
  check(item: PendingCsatDigest): string[];
}

export class PendingCsatDigestRequiredCurrencyRule implements PendingCsatDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCsatDigest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCsatDigestRetriesRangeRule implements PendingCsatDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCsatDigest): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingCsatDigestMinimumRangeRule implements PendingCsatDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCsatDigest): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingCsatDigestCodePrefixRule implements PendingCsatDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingCsatDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingCsatDigestRequiredCodeRule implements PendingCsatDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCsatDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCsatDigestAllowedCodeRule implements PendingCsatDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingCsatDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a pending csat digest. */
export class PendingCsatDigestValidator {
  rules: PendingCsatDigestRule[];

  constructor(rules: PendingCsatDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCsatDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingCsatDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCsatDigest[]): Map<string, string[]> {
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

export function defaultPendingCsatDigestValidator(): PendingCsatDigestValidator {
  return new PendingCsatDigestValidator(
    [
      new PendingCsatDigestRequiredCurrencyRule("pending csat digest needs a value"),
      new PendingCsatDigestRetriesRangeRule(64, 86400),
      new PendingCsatDigestMinimumRangeRule(7.9, 4722.2),
      new PendingCsatDigestCodePrefixRule("ACM"),
      new PendingCsatDigestRequiredCodeRule("pending csat digest needs a value"),
      new PendingCsatDigestAllowedCodeRule([]),
    ],
  );
}
