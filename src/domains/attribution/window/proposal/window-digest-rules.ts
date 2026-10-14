import * as text from "../../../../kit/text.js";
import { WindowDigest } from "./window-digest.js";

/** A rule a window digest must pass. Check returns its problems, or none. */
export interface WindowDigestRule {
  check(item: WindowDigest): string[];
}

export class WindowDigestAllowedNameRule implements WindowDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class WindowDigestCurrencyLengthRule implements WindowDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowDigest): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowDigestVariantLengthRule implements WindowDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowDigest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowDigestDurationMinutesRangeRule implements WindowDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowDigest): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowDigestRequiredCodeRule implements WindowDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window digest. */
export class WindowDigestValidator {
  rules: WindowDigestRule[];

  constructor(rules: WindowDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WindowDigest): string[] {
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

  requireValid(item: WindowDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowDigest[]): Map<string, string[]> {
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

export function defaultWindowDigestValidator(): WindowDigestValidator {
  return new WindowDigestValidator(
    [
      new WindowDigestAllowedNameRule([]),
      new WindowDigestCurrencyLengthRule(3600),
      new WindowDigestVariantLengthRule(255),
      new WindowDigestDurationMinutesRangeRule(120, 1000),
      new WindowDigestRequiredCodeRule("window digest needs an entry"),
    ],
  );
}
