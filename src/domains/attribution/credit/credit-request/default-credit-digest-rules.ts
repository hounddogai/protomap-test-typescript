import * as text from "../../../../kit/text.js";
import { DefaultCreditDigest } from "./default-credit-digest.js";

/** A rule a default credit digest must pass. Check returns its problems, or none. */
export interface DefaultCreditDigestRule {
  check(item: DefaultCreditDigest): string[];
}

export class DefaultCreditDigestCodeLengthRule implements DefaultCreditDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCreditDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultCreditDigestDurationMinutesRangeRule implements DefaultCreditDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCreditDigest): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultCreditDigestRequiredContactEmailRule implements DefaultCreditDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCreditDigest): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCreditDigestAllowedContactEmailRule implements DefaultCreditDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultCreditDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is out of range`];
    return [];
  }
}

export class DefaultCreditDigestContactEmailLengthRule implements DefaultCreditDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCreditDigest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultCreditDigestConversionRateRangeRule implements DefaultCreditDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCreditDigest): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default credit digest. */
export class DefaultCreditDigestValidator {
  rules: DefaultCreditDigestRule[];

  constructor(rules: DefaultCreditDigestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCreditDigest): string[] {
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

  requireValid(item: DefaultCreditDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCreditDigest[]): Map<string, string[]> {
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

export function defaultDefaultCreditDigestValidator(): DefaultCreditDigestValidator {
  return new DefaultCreditDigestValidator(
    [
      new DefaultCreditDigestCodeLengthRule(1000),
      new DefaultCreditDigestDurationMinutesRangeRule(32, 86400),
      new DefaultCreditDigestRequiredContactEmailRule("default credit digest needs a value"),
      new DefaultCreditDigestAllowedContactEmailRule(["lenient", "manual"]),
      new DefaultCreditDigestContactEmailLengthRule(64),
      new DefaultCreditDigestConversionRateRangeRule(3.1, 4408.2),
    ],
  );
}
