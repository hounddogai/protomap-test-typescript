import { ManualBidRuleAgreement } from "./manual-bid-rule-agreement.js";

/** A rule a manual bid rule agreement must pass. Check returns its problems, or none. */
export interface ManualBidRuleAgreementRule {
  check(item: ManualBidRuleAgreement): string[];
}

export class ManualBidRuleAgreementCountryLengthRule implements ManualBidRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBidRuleAgreement): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBidRuleAgreementMaximumRangeRule implements ManualBidRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleAgreement): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualBidRuleAgreementCodePrefixRule implements ManualBidRuleAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBidRuleAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual bid rule agreement. */
export class ManualBidRuleAgreementValidator {
  rules: ManualBidRuleAgreementRule[];

  constructor(rules: ManualBidRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBidRuleAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualBidRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBidRuleAgreement[]): Map<string, string[]> {
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

export function defaultManualBidRuleAgreementValidator(): ManualBidRuleAgreementValidator {
  return new ManualBidRuleAgreementValidator(
    [
      new ManualBidRuleAgreementCountryLengthRule(32),
      new ManualBidRuleAgreementMaximumRangeRule(1.3, 2081.2),
      new ManualBidRuleAgreementCodePrefixRule("ACM"),
    ],
  );
}
