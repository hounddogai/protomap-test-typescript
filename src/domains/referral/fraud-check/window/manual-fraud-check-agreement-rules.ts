import * as text from "../../../../kit/text.js";
import { ManualFraudCheckAgreement } from "./manual-fraud-check-agreement.js";

/** A rule a manual fraud check agreement must pass. Check returns its problems, or none. */
export interface ManualFraudCheckAgreementRule {
  check(item: ManualFraudCheckAgreement): string[];
}

export class ManualFraudCheckAgreementRequiredLabelRule implements ManualFraudCheckAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFraudCheckAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFraudCheckAgreementCodeLengthRule implements ManualFraudCheckAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFraudCheckAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFraudCheckAgreementAllowedSummaryRule implements ManualFraudCheckAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualFraudCheckAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is inconsistent`];
    return [];
  }
}

export class ManualFraudCheckAgreementSummaryLengthRule implements ManualFraudCheckAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFraudCheckAgreement): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFraudCheckAgreementBudgetRangeRule implements ManualFraudCheckAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFraudCheckAgreement): string[] {
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

export class ManualFraudCheckAgreementCodePrefixRule implements ManualFraudCheckAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualFraudCheckAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual fraud check agreement. */
export class ManualFraudCheckAgreementValidator {
  rules: ManualFraudCheckAgreementRule[];

  constructor(rules: ManualFraudCheckAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFraudCheckAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFraudCheckAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFraudCheckAgreement[]): Map<string, string[]> {
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

export function defaultManualFraudCheckAgreementValidator(): ManualFraudCheckAgreementValidator {
  return new ManualFraudCheckAgreementValidator(
    [
      new ManualFraudCheckAgreementRequiredLabelRule("manual fraud check agreement needs this field"),
      new ManualFraudCheckAgreementCodeLengthRule(64),
      new ManualFraudCheckAgreementAllowedSummaryRule(["weighted"]),
      new ManualFraudCheckAgreementSummaryLengthRule(120),
      new ManualFraudCheckAgreementBudgetRangeRule(0.1, 2769.1),
      new ManualFraudCheckAgreementCodePrefixRule("Q"),
    ],
  );
}
