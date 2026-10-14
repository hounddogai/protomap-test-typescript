import * as text from "../../../../kit/text.js";
import { PacingTier } from "./pacing-tier.js";

/** A rule a pacing tier must pass. Check returns its problems, or none. */
export interface PacingTierRule {
  check(item: PacingTier): string[];
}

export class PacingTierCodePrefixRule implements PacingTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingTierCodeLengthRule implements PacingTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingTierAllowedTimezoneRule implements PacingTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is out of range`];
    return [];
  }
}

export class PacingTierDiscountRangeRule implements PacingTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingTier): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingTierApprovedGuardRule implements PacingTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PacingTier): string[] {
    if (item.approved && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PacingTierRequiredNameRule implements PacingTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing tier. */
export class PacingTierValidator {
  rules: PacingTierRule[];

  constructor(rules: PacingTierRule[]) {
    this.rules = rules;
  }

  validate(item: PacingTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingTier[]): Map<string, string[]> {
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

export function defaultPacingTierValidator(): PacingTierValidator {
  return new PacingTierValidator(
    [
      new PacingTierCodePrefixRule("ACM"),
      new PacingTierCodeLengthRule(86400),
      new PacingTierAllowedTimezoneRule(["manual", "default", "weighted"]),
      new PacingTierDiscountRangeRule(9, 2200.4),
      new PacingTierApprovedGuardRule(9.9),
      new PacingTierRequiredNameRule("pacing tier needs an entry"),
    ],
  );
}
