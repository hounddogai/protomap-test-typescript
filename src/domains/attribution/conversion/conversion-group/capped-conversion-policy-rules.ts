import * as text from "../../../../kit/text.js";
import { CappedConversionPolicy } from "./capped-conversion-policy.js";

/** A rule a capped conversion policy must pass. Check returns its problems, or none. */
export interface CappedConversionPolicyRule {
  check(item: CappedConversionPolicy): string[];
}

export class CappedConversionPolicyCreatedAtRangeRule implements CappedConversionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedConversionPolicy): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedConversionPolicyAllowedPhoneRule implements CappedConversionPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedConversionPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is below minimum`];
    return [];
  }
}

export class CappedConversionPolicyCodeLengthRule implements CappedConversionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedConversionPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedConversionPolicyNameLengthRule implements CappedConversionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedConversionPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped conversion policy. */
export class CappedConversionPolicyValidator {
  rules: CappedConversionPolicyRule[];

  constructor(rules: CappedConversionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: CappedConversionPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedConversionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedConversionPolicy[]): Map<string, string[]> {
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

export function defaultCappedConversionPolicyValidator(): CappedConversionPolicyValidator {
  return new CappedConversionPolicyValidator(
    [
      new CappedConversionPolicyCreatedAtRangeRule(120, 1000),
      new CappedConversionPolicyAllowedPhoneRule([]),
      new CappedConversionPolicyCodeLengthRule(16),
      new CappedConversionPolicyNameLengthRule(3600),
    ],
  );
}
