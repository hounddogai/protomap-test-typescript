import * as text from "../../../../kit/text.js";
import { CreditEstimate } from "./credit-estimate.js";

/** A rule a credit estimate must pass. Check returns its problems, or none. */
export interface CreditEstimateRule {
  check(item: CreditEstimate): string[];
}

export class CreditEstimateRequiredCodeRule implements CreditEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditEstimateChecksumLengthRule implements CreditEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditEstimate): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditEstimateWindowDaysRangeRule implements CreditEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditEstimate): string[] {
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

export class CreditEstimateRequiredChecksumRule implements CreditEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditEstimate): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class CreditEstimateAllowedLocaleRule implements CreditEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

/** Runs every rule of a credit estimate. */
export class CreditEstimateValidator {
  rules: CreditEstimateRule[];

  constructor(rules: CreditEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: CreditEstimate): string[] {
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

  requireValid(item: CreditEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditEstimate[]): Map<string, string[]> {
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

export function defaultCreditEstimateValidator(): CreditEstimateValidator {
  return new CreditEstimateValidator(
    [
      new CreditEstimateRequiredCodeRule("credit estimate needs this field"),
      new CreditEstimateChecksumLengthRule(1000),
      new CreditEstimateWindowDaysRangeRule(32, 120),
      new CreditEstimateRequiredChecksumRule("credit estimate needs an entry"),
      new CreditEstimateAllowedLocaleRule(["weighted"]),
    ],
  );
}
