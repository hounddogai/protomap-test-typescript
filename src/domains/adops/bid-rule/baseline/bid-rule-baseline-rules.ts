import { BidRuleBaseline } from "./bid-rule-baseline.js";

/** A rule a bid rule baseline must pass. Check returns its problems, or none. */
export interface BidRuleBaselineRule {
  check(item: BidRuleBaseline): string[];
}

export class BidRuleBaselineNameLengthRule implements BidRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleBaselineRequiredDescriptionRule implements BidRuleBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleBaseline): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleBaselineRequiredNameRule implements BidRuleBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleBaselineCodePrefixRule implements BidRuleBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a bid rule baseline. */
export class BidRuleBaselineValidator {
  rules: BidRuleBaselineRule[];

  constructor(rules: BidRuleBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleBaseline[]): Map<string, string[]> {
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

export function defaultBidRuleBaselineValidator(): BidRuleBaselineValidator {
  return new BidRuleBaselineValidator(
    [
      new BidRuleBaselineNameLengthRule(32),
      new BidRuleBaselineRequiredDescriptionRule("bid rule baseline needs an entry"),
      new BidRuleBaselineRequiredNameRule("bid rule baseline needs an entry"),
      new BidRuleBaselineCodePrefixRule("Q"),
    ],
  );
}
