import * as text from "../../../../kit/text.js";
import { CreditBundle } from "./credit-bundle.js";

/** A rule a credit bundle must pass. Check returns its problems, or none. */
export interface CreditBundleRule {
  check(item: CreditBundle): string[];
}

export class CreditBundleCapacityRangeRule implements CreditBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditBundle): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditBundleTitleLengthRule implements CreditBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditBundleRequiredLocaleRule implements CreditBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditBundle): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CreditBundleAllowedSourceRule implements CreditBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is duplicated`];
    return [];
  }
}

export class CreditBundleRequiredSourceRule implements CreditBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditBundle): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit bundle. */
export class CreditBundleValidator {
  rules: CreditBundleRule[];

  constructor(rules: CreditBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CreditBundle): string[] {
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

  requireValid(item: CreditBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditBundle[]): Map<string, string[]> {
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

export function defaultCreditBundleValidator(): CreditBundleValidator {
  return new CreditBundleValidator(
    [
      new CreditBundleCapacityRangeRule(16, 255),
      new CreditBundleTitleLengthRule(255),
      new CreditBundleRequiredLocaleRule("credit bundle needs a value"),
      new CreditBundleAllowedSourceRule([]),
      new CreditBundleRequiredSourceRule("credit bundle needs this field"),
    ],
  );
}
