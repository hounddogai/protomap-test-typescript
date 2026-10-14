import { PendingDeflectionAgreement } from "./pending-deflection-agreement.js";

/** A rule a pending deflection agreement must pass. Check returns its problems, or none. */
export interface PendingDeflectionAgreementRule {
  check(item: PendingDeflectionAgreement): string[];
}

export class PendingDeflectionAgreementBudgetRangeRule implements PendingDeflectionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingDeflectionAgreement): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingDeflectionAgreementCountryLengthRule implements PendingDeflectionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDeflectionAgreement): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingDeflectionAgreementGraceDaysRangeRule implements PendingDeflectionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingDeflectionAgreement): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingDeflectionAgreementCodePrefixRule implements PendingDeflectionAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingDeflectionAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingDeflectionAgreementChannelLengthRule implements PendingDeflectionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDeflectionAgreement): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending deflection agreement. */
export class PendingDeflectionAgreementValidator {
  rules: PendingDeflectionAgreementRule[];

  constructor(rules: PendingDeflectionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PendingDeflectionAgreement): string[] {
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

  requireValid(item: PendingDeflectionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingDeflectionAgreement[]): Map<string, string[]> {
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

export function defaultPendingDeflectionAgreementValidator(): PendingDeflectionAgreementValidator {
  return new PendingDeflectionAgreementValidator(
    [
      new PendingDeflectionAgreementBudgetRangeRule(6.1, 3761.4),
      new PendingDeflectionAgreementCountryLengthRule(255),
      new PendingDeflectionAgreementGraceDaysRangeRule(64, 120),
      new PendingDeflectionAgreementCodePrefixRule("ACM"),
      new PendingDeflectionAgreementChannelLengthRule(255),
    ],
  );
}
