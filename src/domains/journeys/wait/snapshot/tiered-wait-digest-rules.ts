import * as text from "../../../../kit/text.js";
import { TieredWaitDigest } from "./tiered-wait-digest.js";

/** A rule a tiered wait digest must pass. Check returns its problems, or none. */
export interface TieredWaitDigestRule {
  check(item: TieredWaitDigest): string[];
}

export class TieredWaitDigestAllowedLocaleRule implements TieredWaitDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredWaitDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

export class TieredWaitDigestRequiredNameRule implements TieredWaitDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWaitDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWaitDigestNameLengthRule implements TieredWaitDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWaitDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWaitDigestDiscountRangeRule implements TieredWaitDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWaitDigest): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredWaitDigestCodePrefixRule implements TieredWaitDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredWaitDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredWaitDigestCodeLengthRule implements TieredWaitDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWaitDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered wait digest. */
export class TieredWaitDigestValidator {
  rules: TieredWaitDigestRule[];

  constructor(rules: TieredWaitDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWaitDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredWaitDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWaitDigest[]): Map<string, string[]> {
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

export function defaultTieredWaitDigestValidator(): TieredWaitDigestValidator {
  return new TieredWaitDigestValidator(
    [
      new TieredWaitDigestAllowedLocaleRule(["strict", "global"]),
      new TieredWaitDigestRequiredNameRule("tiered wait digest needs an entry"),
      new TieredWaitDigestNameLengthRule(80),
      new TieredWaitDigestDiscountRangeRule(1.9, 3498.1),
      new TieredWaitDigestCodePrefixRule("REF"),
      new TieredWaitDigestCodeLengthRule(255),
    ],
  );
}
