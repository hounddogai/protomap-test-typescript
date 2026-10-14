import * as text from "../../../../kit/text.js";
import { StrictRedemptionAgreement } from "./strict-redemption-agreement.js";

/** A rule a strict redemption agreement must pass. Check returns its problems, or none. */
export interface StrictRedemptionAgreementRule {
  check(item: StrictRedemptionAgreement): string[];
}

export class StrictRedemptionAgreementRequiredTimezoneRule implements StrictRedemptionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRedemptionAgreement): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRedemptionAgreementTimezoneLengthRule implements StrictRedemptionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRedemptionAgreement): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRedemptionAgreementSequenceRangeRule implements StrictRedemptionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRedemptionAgreement): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictRedemptionAgreementAllowedLabelRule implements StrictRedemptionAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRedemptionAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class StrictRedemptionAgreementUpdatedAtRangeRule implements StrictRedemptionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRedemptionAgreement): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRedemptionAgreementCapacityRangeRule implements StrictRedemptionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRedemptionAgreement): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict redemption agreement. */
export class StrictRedemptionAgreementValidator {
  rules: StrictRedemptionAgreementRule[];

  constructor(rules: StrictRedemptionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRedemptionAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictRedemptionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRedemptionAgreement[]): Map<string, string[]> {
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

export function defaultStrictRedemptionAgreementValidator(): StrictRedemptionAgreementValidator {
  return new StrictRedemptionAgreementValidator(
    [
      new StrictRedemptionAgreementRequiredTimezoneRule("strict redemption agreement needs an entry"),
      new StrictRedemptionAgreementTimezoneLengthRule(16),
      new StrictRedemptionAgreementSequenceRangeRule(16, 32),
      new StrictRedemptionAgreementAllowedLabelRule(["rolling", "strict"]),
      new StrictRedemptionAgreementUpdatedAtRangeRule(80, 86400),
      new StrictRedemptionAgreementCapacityRangeRule(16, 86400),
    ],
  );
}
