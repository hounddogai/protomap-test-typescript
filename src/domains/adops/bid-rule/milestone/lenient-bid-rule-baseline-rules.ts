import * as text from "../../../../kit/text.js";
import { LenientBidRuleBaseline } from "./lenient-bid-rule-baseline.js";

/** A rule a lenient bid rule baseline must pass. Check returns its problems, or none. */
export interface LenientBidRuleBaselineRule {
  check(item: LenientBidRuleBaseline): string[];
}

export class LenientBidRuleBaselineTitleLengthRule implements LenientBidRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBidRuleBaselineContactEmailLengthRule implements LenientBidRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleBaseline): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBidRuleBaselineStartsAtRangeRule implements LenientBidRuleBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientBidRuleBaseline): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientBidRuleBaselineCodeLengthRule implements LenientBidRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBidRuleBaselineAllowedContactEmailRule implements LenientBidRuleBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientBidRuleBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is too long`];
    return [];
  }
}

export class LenientBidRuleBaselineRequiredContactEmailRule implements LenientBidRuleBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBidRuleBaseline): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient bid rule baseline. */
export class LenientBidRuleBaselineValidator {
  rules: LenientBidRuleBaselineRule[];

  constructor(rules: LenientBidRuleBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBidRuleBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientBidRuleBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBidRuleBaseline[]): Map<string, string[]> {
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

export function defaultLenientBidRuleBaselineValidator(): LenientBidRuleBaselineValidator {
  return new LenientBidRuleBaselineValidator(
    [
      new LenientBidRuleBaselineTitleLengthRule(3600),
      new LenientBidRuleBaselineContactEmailLengthRule(255),
      new LenientBidRuleBaselineStartsAtRangeRule(16, 32),
      new LenientBidRuleBaselineCodeLengthRule(86400),
      new LenientBidRuleBaselineAllowedContactEmailRule(["default"]),
      new LenientBidRuleBaselineRequiredContactEmailRule("lenient bid rule baseline needs a value"),
    ],
  );
}
