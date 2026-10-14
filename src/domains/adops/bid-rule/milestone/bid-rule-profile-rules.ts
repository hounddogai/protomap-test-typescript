import * as text from "../../../../kit/text.js";
import { BidRuleProfile } from "./bid-rule-profile.js";

/** A rule a bid rule profile must pass. Check returns its problems, or none. */
export interface BidRuleProfileRule {
  check(item: BidRuleProfile): string[];
}

export class BidRuleProfileCodeLengthRule implements BidRuleProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleProfileAllowedCountryRule implements BidRuleProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is stale`];
    return [];
  }
}

export class BidRuleProfileRequiredCountryRule implements BidRuleProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleProfile): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleProfileRequiredLabelRule implements BidRuleProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule profile. */
export class BidRuleProfileValidator {
  rules: BidRuleProfileRule[];

  constructor(rules: BidRuleProfileRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleProfile): string[] {
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

  requireValid(item: BidRuleProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleProfile[]): Map<string, string[]> {
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

export function defaultBidRuleProfileValidator(): BidRuleProfileValidator {
  return new BidRuleProfileValidator(
    [
      new BidRuleProfileCodeLengthRule(64),
      new BidRuleProfileAllowedCountryRule(["pending", "manual"]),
      new BidRuleProfileRequiredCountryRule("bid rule profile needs a value"),
      new BidRuleProfileRequiredLabelRule("bid rule profile needs a value"),
    ],
  );
}
