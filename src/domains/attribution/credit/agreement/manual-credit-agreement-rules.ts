import * as text from "../../../../kit/text.js";
import { ManualCreditAgreement } from "./manual-credit-agreement.js";

/** A rule a manual credit agreement must pass. Check returns its problems, or none. */
export interface ManualCreditAgreementRule {
  check(item: ManualCreditAgreement): string[];
}

export class ManualCreditAgreementTitleLengthRule implements ManualCreditAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreditAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreditAgreementRequiredTitleRule implements ManualCreditAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualCreditAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualCreditAgreementCampaignRefLengthRule implements ManualCreditAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreditAgreement): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreditAgreementAllowedTitleRule implements ManualCreditAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualCreditAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class ManualCreditAgreementCodeLengthRule implements ManualCreditAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreditAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreditAgreementCeilingRangeRule implements ManualCreditAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreditAgreement): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual credit agreement. */
export class ManualCreditAgreementValidator {
  rules: ManualCreditAgreementRule[];

  constructor(rules: ManualCreditAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualCreditAgreement): string[] {
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

  requireValid(item: ManualCreditAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualCreditAgreement[]): Map<string, string[]> {
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

export function defaultManualCreditAgreementValidator(): ManualCreditAgreementValidator {
  return new ManualCreditAgreementValidator(
    [
      new ManualCreditAgreementTitleLengthRule(32),
      new ManualCreditAgreementRequiredTitleRule("manual credit agreement needs this field"),
      new ManualCreditAgreementCampaignRefLengthRule(16),
      new ManualCreditAgreementAllowedTitleRule([]),
      new ManualCreditAgreementCodeLengthRule(1000),
      new ManualCreditAgreementCeilingRangeRule(4.5, 4447.2),
    ],
  );
}
