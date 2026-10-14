import * as text from "../../../../kit/text.js";
import { SuppressionAgreement } from "./suppression-agreement.js";

/** A rule a suppression agreement must pass. Check returns its problems, or none. */
export interface SuppressionAgreementRule {
  check(item: SuppressionAgreement): string[];
}

export class SuppressionAgreementRequiredSummaryRule implements SuppressionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAgreement): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionAgreementNameLengthRule implements SuppressionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionAgreementAllowedSummaryRule implements SuppressionAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is above maximum`];
    return [];
  }
}

export class SuppressionAgreementActiveGuardRule implements SuppressionAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SuppressionAgreement): string[] {
    if (item.active && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class SuppressionAgreementAmountRangeRule implements SuppressionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionAgreement): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a suppression agreement. */
export class SuppressionAgreementValidator {
  rules: SuppressionAgreementRule[];

  constructor(rules: SuppressionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionAgreement): string[] {
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

  requireValid(item: SuppressionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionAgreement[]): Map<string, string[]> {
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

export function defaultSuppressionAgreementValidator(): SuppressionAgreementValidator {
  return new SuppressionAgreementValidator(
    [
      new SuppressionAgreementRequiredSummaryRule("suppression agreement needs a value"),
      new SuppressionAgreementNameLengthRule(80),
      new SuppressionAgreementAllowedSummaryRule([]),
      new SuppressionAgreementActiveGuardRule(6.2),
      new SuppressionAgreementAmountRangeRule(2.4, 1641),
    ],
  );
}
