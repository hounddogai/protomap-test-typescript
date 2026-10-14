import * as text from "../../../../kit/text.js";
import { StrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

/** A rule a strict bid rule agreement must pass. Check returns its problems, or none. */
export interface StrictBidRuleAgreementRule {
  check(item: StrictBidRuleAgreement): string[];
}

export class StrictBidRuleAgreementAllowedTimezoneRule implements StrictBidRuleAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictBidRuleAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is expired`];
    return [];
  }
}

export class StrictBidRuleAgreementCodePrefixRule implements StrictBidRuleAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictBidRuleAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictBidRuleAgreementRequiredTimezoneRule implements StrictBidRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBidRuleAgreement): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBidRuleAgreementTimezoneLengthRule implements StrictBidRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBidRuleAgreement): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBidRuleAgreementCodeLengthRule implements StrictBidRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBidRuleAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict bid rule agreement. */
export class StrictBidRuleAgreementValidator {
  rules: StrictBidRuleAgreementRule[];

  constructor(rules: StrictBidRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBidRuleAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictBidRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBidRuleAgreement[]): Map<string, string[]> {
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

export function defaultStrictBidRuleAgreementValidator(): StrictBidRuleAgreementValidator {
  return new StrictBidRuleAgreementValidator(
    [
      new StrictBidRuleAgreementAllowedTimezoneRule([]),
      new StrictBidRuleAgreementCodePrefixRule("OPS"),
      new StrictBidRuleAgreementRequiredTimezoneRule("strict bid rule agreement needs this field"),
      new StrictBidRuleAgreementTimezoneLengthRule(32),
      new StrictBidRuleAgreementCodeLengthRule(64),
    ],
  );
}
