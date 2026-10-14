import { DeflectionAgreement } from "./deflection-agreement.js";

/** A rule a deflection agreement must pass. Check returns its problems, or none. */
export interface DeflectionAgreementRule {
  check(item: DeflectionAgreement): string[];
}

export class DeflectionAgreementCodePrefixRule implements DeflectionAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionAgreementChannelLengthRule implements DeflectionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionAgreement): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionAgreementExpiresAtRangeRule implements DeflectionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionAgreement): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a deflection agreement. */
export class DeflectionAgreementValidator {
  rules: DeflectionAgreementRule[];

  constructor(rules: DeflectionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionAgreement): string[] {
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

  requireValid(item: DeflectionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionAgreement[]): Map<string, string[]> {
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

export function defaultDeflectionAgreementValidator(): DeflectionAgreementValidator {
  return new DeflectionAgreementValidator(
    [
      new DeflectionAgreementCodePrefixRule("Q"),
      new DeflectionAgreementChannelLengthRule(3600),
      new DeflectionAgreementExpiresAtRangeRule(255, 1000),
    ],
  );
}
