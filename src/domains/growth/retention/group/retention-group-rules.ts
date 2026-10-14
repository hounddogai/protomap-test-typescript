import * as text from "../../../../kit/text.js";
import { RetentionGroup } from "./retention-group.js";

/** A rule a retention group must pass. Check returns its problems, or none. */
export interface RetentionGroupRule {
  check(item: RetentionGroup): string[];
}

export class RetentionGroupAllowedCodeRule implements RetentionGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class RetentionGroupMaximumRangeRule implements RetentionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionGroup): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionGroupCodeLengthRule implements RetentionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionGroupCodePrefixRule implements RetentionGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionGroupOpenRateRangeRule implements RetentionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionGroup): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionGroupPhoneLengthRule implements RetentionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionGroup): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention group. */
export class RetentionGroupValidator {
  rules: RetentionGroupRule[];

  constructor(rules: RetentionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionGroup): string[] {
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

  requireValid(item: RetentionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionGroup[]): Map<string, string[]> {
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

export function defaultRetentionGroupValidator(): RetentionGroupValidator {
  return new RetentionGroupValidator(
    [
      new RetentionGroupAllowedCodeRule([]),
      new RetentionGroupMaximumRangeRule(4.3, 4182.5),
      new RetentionGroupCodeLengthRule(80),
      new RetentionGroupCodePrefixRule("OPS"),
      new RetentionGroupOpenRateRangeRule(1.2, 2301.5),
      new RetentionGroupPhoneLengthRule(1000),
    ],
  );
}
