import * as text from "../../../../kit/text.js";
import { TierException } from "./tier-exception.js";

/** A rule a tier exception must pass. Check returns its problems, or none. */
export interface TierExceptionRule {
  check(item: TierException): string[];
}

export class TierExceptionRequiredCodeRule implements TierExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierExceptionRetriesRangeRule implements TierExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierException): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierExceptionApprovedGuardRule implements TierExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TierException): string[] {
    if (item.approved && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TierExceptionLabelLengthRule implements TierExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierExceptionAllowedCodeRule implements TierExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class TierExceptionCodePrefixRule implements TierExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TierException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tier exception. */
export class TierExceptionValidator {
  rules: TierExceptionRule[];

  constructor(rules: TierExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: TierException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierException[]): Map<string, string[]> {
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

export function defaultTierExceptionValidator(): TierExceptionValidator {
  return new TierExceptionValidator(
    [
      new TierExceptionRequiredCodeRule("tier exception needs a value"),
      new TierExceptionRetriesRangeRule(80, 3600),
      new TierExceptionApprovedGuardRule(4.8),
      new TierExceptionLabelLengthRule(120),
      new TierExceptionAllowedCodeRule([]),
      new TierExceptionCodePrefixRule("OPS"),
    ],
  );
}
