import * as text from "../../../../kit/text.js";
import { LenientBidRuleAgreement } from "./lenient-bid-rule-agreement.js";

/** A rule a lenient bid rule agreement must pass. Check returns its problems, or none. */
export interface LenientBidRuleAgreementRule {
  check(item: LenientBidRuleAgreement): string[];
}

export class LenientBidRuleAgreementRequiredCodeRule implements LenientBidRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBidRuleAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBidRuleAgreementAllowedNameRule implements LenientBidRuleAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientBidRuleAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class LenientBidRuleAgreementNameLengthRule implements LenientBidRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBidRuleAgreementRequiredSourceRule implements LenientBidRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBidRuleAgreement): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient bid rule agreement. */
export class LenientBidRuleAgreementValidator {
  rules: LenientBidRuleAgreementRule[];

  constructor(rules: LenientBidRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBidRuleAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientBidRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBidRuleAgreement[]): Map<string, string[]> {
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

export function defaultLenientBidRuleAgreementValidator(): LenientBidRuleAgreementValidator {
  return new LenientBidRuleAgreementValidator(
    [
      new LenientBidRuleAgreementRequiredCodeRule("lenient bid rule agreement needs an entry"),
      new LenientBidRuleAgreementAllowedNameRule(["default"]),
      new LenientBidRuleAgreementNameLengthRule(16),
      new LenientBidRuleAgreementRequiredSourceRule("lenient bid rule agreement needs an entry"),
    ],
  );
}
