import { DoubleOptInBundle } from "./double-opt-in-bundle.js";

/** A rule a double opt in bundle must pass. Check returns its problems, or none. */
export interface DoubleOptInBundleRule {
  check(item: DoubleOptInBundle): string[];
}

export class DoubleOptInBundleRequiredCodeRule implements DoubleOptInBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInBundleCodeLengthRule implements DoubleOptInBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInBundleRequiredExternalRefRule implements DoubleOptInBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInBundle): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInBundleNameLengthRule implements DoubleOptInBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInBundleCountryLengthRule implements DoubleOptInBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInBundle): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInBundleSendAtRangeRule implements DoubleOptInBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInBundle): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a double opt in bundle. */
export class DoubleOptInBundleValidator {
  rules: DoubleOptInBundleRule[];

  constructor(rules: DoubleOptInBundleRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInBundle): string[] {
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

  requireValid(item: DoubleOptInBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInBundle[]): Map<string, string[]> {
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

export function defaultDoubleOptInBundleValidator(): DoubleOptInBundleValidator {
  return new DoubleOptInBundleValidator(
    [
      new DoubleOptInBundleRequiredCodeRule("double opt in bundle needs this field"),
      new DoubleOptInBundleCodeLengthRule(64),
      new DoubleOptInBundleRequiredExternalRefRule("double opt in bundle needs this field"),
      new DoubleOptInBundleNameLengthRule(16),
      new DoubleOptInBundleCountryLengthRule(255),
      new DoubleOptInBundleSendAtRangeRule(64, 80),
    ],
  );
}
