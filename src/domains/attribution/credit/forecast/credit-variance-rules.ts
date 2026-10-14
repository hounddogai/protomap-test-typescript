import * as text from "../../../../kit/text.js";
import { CreditVariance } from "./credit-variance.js";

/** A rule a credit variance must pass. Check returns its problems, or none. */
export interface CreditVarianceRule {
  check(item: CreditVariance): string[];
}

export class CreditVarianceCodeLengthRule implements CreditVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditVarianceWindowDaysRangeRule implements CreditVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditVariance): string[] {
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

export class CreditVarianceRequiredCodeRule implements CreditVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditVarianceRequiredContactEmailRule implements CreditVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditVariance): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class CreditVarianceAllowedCodeRule implements CreditVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

/** Runs every rule of a credit variance. */
export class CreditVarianceValidator {
  rules: CreditVarianceRule[];

  constructor(rules: CreditVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: CreditVariance): string[] {
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

  requireValid(item: CreditVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditVariance[]): Map<string, string[]> {
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

export function defaultCreditVarianceValidator(): CreditVarianceValidator {
  return new CreditVarianceValidator(
    [
      new CreditVarianceCodeLengthRule(255),
      new CreditVarianceWindowDaysRangeRule(16, 80),
      new CreditVarianceRequiredCodeRule("credit variance needs an entry"),
      new CreditVarianceRequiredContactEmailRule("credit variance needs a value"),
      new CreditVarianceAllowedCodeRule([]),
    ],
  );
}
