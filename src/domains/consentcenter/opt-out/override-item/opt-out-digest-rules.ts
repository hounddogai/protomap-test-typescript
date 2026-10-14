import { OptOutDigest } from "./opt-out-digest.js";

/** A rule a opt out digest must pass. Check returns its problems, or none. */
export interface OptOutDigestRule {
  check(item: OptOutDigest): string[];
}

export class OptOutDigestRequiredCodeRule implements OptOutDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutDigestRequiredOwnerIdRule implements OptOutDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutDigest): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutDigestRequiredLabelRule implements OptOutDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutDigestPhoneLengthRule implements OptOutDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutDigest): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutDigestConversionRateRangeRule implements OptOutDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutDigest): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a opt out digest. */
export class OptOutDigestValidator {
  rules: OptOutDigestRule[];

  constructor(rules: OptOutDigestRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutDigest): string[] {
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

  requireValid(item: OptOutDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutDigest[]): Map<string, string[]> {
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

export function defaultOptOutDigestValidator(): OptOutDigestValidator {
  return new OptOutDigestValidator(
    [
      new OptOutDigestRequiredCodeRule("opt out digest needs an entry"),
      new OptOutDigestRequiredOwnerIdRule("opt out digest needs this field"),
      new OptOutDigestRequiredLabelRule("opt out digest needs a value"),
      new OptOutDigestPhoneLengthRule(86400),
      new OptOutDigestConversionRateRangeRule(2.9, 2215.4),
    ],
  );
}
