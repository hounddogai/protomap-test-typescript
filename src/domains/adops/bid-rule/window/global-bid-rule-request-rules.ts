import * as text from "../../../../kit/text.js";
import { GlobalBidRuleRequest } from "./global-bid-rule-request.js";

/** A rule a global bid rule request must pass. Check returns its problems, or none. */
export interface GlobalBidRuleRequestRule {
  check(item: GlobalBidRuleRequest): string[];
}

export class GlobalBidRuleRequestCodePrefixRule implements GlobalBidRuleRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalBidRuleRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalBidRuleRequestRequiredCodeRule implements GlobalBidRuleRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBidRuleRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBidRuleRequestRequiredDescriptionRule implements GlobalBidRuleRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBidRuleRequest): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBidRuleRequestAllowedCurrencyRule implements GlobalBidRuleRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalBidRuleRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is out of range`];
    return [];
  }
}

export class GlobalBidRuleRequestDescriptionLengthRule implements GlobalBidRuleRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBidRuleRequest): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global bid rule request. */
export class GlobalBidRuleRequestValidator {
  rules: GlobalBidRuleRequestRule[];

  constructor(rules: GlobalBidRuleRequestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBidRuleRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalBidRuleRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBidRuleRequest[]): Map<string, string[]> {
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

export function defaultGlobalBidRuleRequestValidator(): GlobalBidRuleRequestValidator {
  return new GlobalBidRuleRequestValidator(
    [
      new GlobalBidRuleRequestCodePrefixRule("X"),
      new GlobalBidRuleRequestRequiredCodeRule("global bid rule request needs a value"),
      new GlobalBidRuleRequestRequiredDescriptionRule("global bid rule request needs a value"),
      new GlobalBidRuleRequestAllowedCurrencyRule(["adaptive"]),
      new GlobalBidRuleRequestDescriptionLengthRule(1000),
    ],
  );
}
