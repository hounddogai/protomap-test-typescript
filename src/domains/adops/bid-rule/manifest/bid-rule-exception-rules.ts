import { BidRuleException } from "./bid-rule-exception.js";

/** A rule a bid rule exception must pass. Check returns its problems, or none. */
export interface BidRuleExceptionRule {
  check(item: BidRuleException): string[];
}

export class BidRuleExceptionRequiredCodeRule implements BidRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleExceptionCodePrefixRule implements BidRuleExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleExceptionFrequencyCapRangeRule implements BidRuleExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleException): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleExceptionRequiredContactEmailRule implements BidRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleException): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule exception. */
export class BidRuleExceptionValidator {
  rules: BidRuleExceptionRule[];

  constructor(rules: BidRuleExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleException): string[] {
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

  requireValid(item: BidRuleException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleException[]): Map<string, string[]> {
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

export function defaultBidRuleExceptionValidator(): BidRuleExceptionValidator {
  return new BidRuleExceptionValidator(
    [
      new BidRuleExceptionRequiredCodeRule("bid rule exception needs this field"),
      new BidRuleExceptionCodePrefixRule("OPS"),
      new BidRuleExceptionFrequencyCapRangeRule(32, 1000),
      new BidRuleExceptionRequiredContactEmailRule("bid rule exception needs this field"),
    ],
  );
}
