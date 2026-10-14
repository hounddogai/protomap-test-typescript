import { EnrollmentRule } from "./enrollment-rule.js";

/** A rule a enrollment rule must pass. Check returns its problems, or none. */
export interface EnrollmentRuleRule {
  check(item: EnrollmentRule): string[];
}

export class EnrollmentRuleCodePrefixRule implements EnrollmentRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentRuleRevisionRangeRule implements EnrollmentRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentRule): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentRuleCodeLengthRule implements EnrollmentRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment rule. */
export class EnrollmentRuleValidator {
  rules: EnrollmentRuleRule[];

  constructor(rules: EnrollmentRuleRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentRule): string[] {
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

  requireValid(item: EnrollmentRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentRule[]): Map<string, string[]> {
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

export function defaultEnrollmentRuleValidator(): EnrollmentRuleValidator {
  return new EnrollmentRuleValidator(
    [
      new EnrollmentRuleCodePrefixRule("REF"),
      new EnrollmentRuleRevisionRangeRule(16, 86400),
      new EnrollmentRuleCodeLengthRule(32),
    ],
  );
}
