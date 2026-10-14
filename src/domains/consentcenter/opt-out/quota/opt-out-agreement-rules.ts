import * as text from "../../../../kit/text.js";
import { OptOutAgreement } from "./opt-out-agreement.js";

/** A rule a opt out agreement must pass. Check returns its problems, or none. */
export interface OptOutAgreementRule {
  check(item: OptOutAgreement): string[];
}

export class OptOutAgreementSourceLengthRule implements OptOutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutAgreement): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutAgreementCampaignRefLengthRule implements OptOutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutAgreement): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutAgreementRequiredCodeRule implements OptOutAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutAgreementAllowedCampaignRefRule implements OptOutAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is not allowed`];
    return [];
  }
}

export class OptOutAgreementGraceDaysRangeRule implements OptOutAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutAgreement): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a opt out agreement. */
export class OptOutAgreementValidator {
  rules: OptOutAgreementRule[];

  constructor(rules: OptOutAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutAgreement): string[] {
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

  requireValid(item: OptOutAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutAgreement[]): Map<string, string[]> {
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

export function defaultOptOutAgreementValidator(): OptOutAgreementValidator {
  return new OptOutAgreementValidator(
    [
      new OptOutAgreementSourceLengthRule(32),
      new OptOutAgreementCampaignRefLengthRule(86400),
      new OptOutAgreementRequiredCodeRule("opt out agreement needs a value"),
      new OptOutAgreementAllowedCampaignRefRule(["fallback", "strict"]),
      new OptOutAgreementGraceDaysRangeRule(120, 1000),
    ],
  );
}
