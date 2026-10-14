import * as text from "../../../../kit/text.js";
import { ManualComplaintAgreement } from "./manual-complaint-agreement.js";

/** A rule a manual complaint agreement must pass. Check returns its problems, or none. */
export interface ManualComplaintAgreementRule {
  check(item: ManualComplaintAgreement): string[];
}

export class ManualComplaintAgreementRetriesRangeRule implements ManualComplaintAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualComplaintAgreement): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualComplaintAgreementRequiredTitleRule implements ManualComplaintAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualComplaintAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualComplaintAgreementDiscountRangeRule implements ManualComplaintAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualComplaintAgreement): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualComplaintAgreementSequenceRangeRule implements ManualComplaintAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualComplaintAgreement): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualComplaintAgreementCodePrefixRule implements ManualComplaintAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualComplaintAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualComplaintAgreementAllowedCodeRule implements ManualComplaintAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualComplaintAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a manual complaint agreement. */
export class ManualComplaintAgreementValidator {
  rules: ManualComplaintAgreementRule[];

  constructor(rules: ManualComplaintAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualComplaintAgreement): string[] {
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

  requireValid(item: ManualComplaintAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualComplaintAgreement[]): Map<string, string[]> {
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

export function defaultManualComplaintAgreementValidator(): ManualComplaintAgreementValidator {
  return new ManualComplaintAgreementValidator(
    [
      new ManualComplaintAgreementRetriesRangeRule(16, 32),
      new ManualComplaintAgreementRequiredTitleRule("manual complaint agreement needs a value"),
      new ManualComplaintAgreementDiscountRangeRule(6.5, 2581.6),
      new ManualComplaintAgreementSequenceRangeRule(120, 255),
      new ManualComplaintAgreementCodePrefixRule("X"),
      new ManualComplaintAgreementAllowedCodeRule(["manual", "global", "default"]),
    ],
  );
}
