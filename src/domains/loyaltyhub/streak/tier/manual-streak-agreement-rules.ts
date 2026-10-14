import * as text from "../../../../kit/text.js";
import { ManualStreakAgreement } from "./manual-streak-agreement.js";

/** A rule a manual streak agreement must pass. Check returns its problems, or none. */
export interface ManualStreakAgreementRule {
  check(item: ManualStreakAgreement): string[];
}

export class ManualStreakAgreementAllowedCampaignRefRule implements ManualStreakAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualStreakAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is inconsistent`];
    return [];
  }
}

export class ManualStreakAgreementCodeLengthRule implements ManualStreakAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualStreakAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualStreakAgreementMinimumRangeRule implements ManualStreakAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualStreakAgreement): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual streak agreement. */
export class ManualStreakAgreementValidator {
  rules: ManualStreakAgreementRule[];

  constructor(rules: ManualStreakAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualStreakAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualStreakAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualStreakAgreement[]): Map<string, string[]> {
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

export function defaultManualStreakAgreementValidator(): ManualStreakAgreementValidator {
  return new ManualStreakAgreementValidator(
    [
      new ManualStreakAgreementAllowedCampaignRefRule(["legacy", "default", "capped"]),
      new ManualStreakAgreementCodeLengthRule(32),
      new ManualStreakAgreementMinimumRangeRule(5.3, 3250.3),
    ],
  );
}
