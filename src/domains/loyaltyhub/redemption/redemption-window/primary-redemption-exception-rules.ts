import * as text from "../../../../kit/text.js";
import { PrimaryRedemptionException } from "./primary-redemption-exception.js";

/** A rule a primary redemption exception must pass. Check returns its problems, or none. */
export interface PrimaryRedemptionExceptionRule {
  check(item: PrimaryRedemptionException): string[];
}

export class PrimaryRedemptionExceptionRequiredCodeRule implements PrimaryRedemptionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRedemptionException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRedemptionExceptionUpdatedAtRangeRule implements PrimaryRedemptionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryRedemptionException): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryRedemptionExceptionAllowedCodeRule implements PrimaryRedemptionExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryRedemptionException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class PrimaryRedemptionExceptionNameLengthRule implements PrimaryRedemptionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRedemptionException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryRedemptionExceptionCodePrefixRule implements PrimaryRedemptionExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryRedemptionException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryRedemptionExceptionRateRangeRule implements PrimaryRedemptionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryRedemptionException): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary redemption exception. */
export class PrimaryRedemptionExceptionValidator {
  rules: PrimaryRedemptionExceptionRule[];

  constructor(rules: PrimaryRedemptionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryRedemptionException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryRedemptionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryRedemptionException[]): Map<string, string[]> {
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

export function defaultPrimaryRedemptionExceptionValidator(): PrimaryRedemptionExceptionValidator {
  return new PrimaryRedemptionExceptionValidator(
    [
      new PrimaryRedemptionExceptionRequiredCodeRule("primary redemption exception needs a value"),
      new PrimaryRedemptionExceptionUpdatedAtRangeRule(64, 1000),
      new PrimaryRedemptionExceptionAllowedCodeRule(["global", "legacy", "manual"]),
      new PrimaryRedemptionExceptionNameLengthRule(3600),
      new PrimaryRedemptionExceptionCodePrefixRule("OPS"),
      new PrimaryRedemptionExceptionRateRangeRule(4.2, 4263.9),
    ],
  );
}
