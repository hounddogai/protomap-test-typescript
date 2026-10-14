import { GlobalBidRuleAgreement } from "./global-bid-rule-agreement.js";

/** A rule a global bid rule agreement must pass. Check returns its problems, or none. */
export interface GlobalBidRuleAgreementRule {
  check(item: GlobalBidRuleAgreement): string[];
}

export class GlobalBidRuleAgreementRequiredCurrencyRule implements GlobalBidRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBidRuleAgreement): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBidRuleAgreementCapacityRangeRule implements GlobalBidRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBidRuleAgreement): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalBidRuleAgreementCodeLengthRule implements GlobalBidRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBidRuleAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBidRuleAgreementRequiredCodeRule implements GlobalBidRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBidRuleAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global bid rule agreement. */
export class GlobalBidRuleAgreementValidator {
  rules: GlobalBidRuleAgreementRule[];

  constructor(rules: GlobalBidRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBidRuleAgreement): string[] {
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

  requireValid(item: GlobalBidRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBidRuleAgreement[]): Map<string, string[]> {
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

export function defaultGlobalBidRuleAgreementValidator(): GlobalBidRuleAgreementValidator {
  return new GlobalBidRuleAgreementValidator(
    [
      new GlobalBidRuleAgreementRequiredCurrencyRule("global bid rule agreement needs a value"),
      new GlobalBidRuleAgreementCapacityRangeRule(16, 80),
      new GlobalBidRuleAgreementCodeLengthRule(32),
      new GlobalBidRuleAgreementRequiredCodeRule("global bid rule agreement needs this field"),
    ],
  );
}
