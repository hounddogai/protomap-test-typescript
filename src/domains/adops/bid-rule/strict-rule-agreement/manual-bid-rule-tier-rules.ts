import { ManualBidRuleTier } from "./manual-bid-rule-tier.js";

/** A rule a manual bid rule tier must pass. Check returns its problems, or none. */
export interface ManualBidRuleTierRule {
  check(item: ManualBidRuleTier): string[];
}

export class ManualBidRuleTierRequiredNameRule implements ManualBidRuleTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBidRuleTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBidRuleTierCodePrefixRule implements ManualBidRuleTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBidRuleTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualBidRuleTierAmountRangeRule implements ManualBidRuleTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleTier): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualBidRuleTierCountryLengthRule implements ManualBidRuleTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBidRuleTier): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBidRuleTierCodeLengthRule implements ManualBidRuleTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBidRuleTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual bid rule tier. */
export class ManualBidRuleTierValidator {
  rules: ManualBidRuleTierRule[];

  constructor(rules: ManualBidRuleTierRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBidRuleTier): string[] {
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

  requireValid(item: ManualBidRuleTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBidRuleTier[]): Map<string, string[]> {
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

export function defaultManualBidRuleTierValidator(): ManualBidRuleTierValidator {
  return new ManualBidRuleTierValidator(
    [
      new ManualBidRuleTierRequiredNameRule("manual bid rule tier needs a value"),
      new ManualBidRuleTierCodePrefixRule("Q"),
      new ManualBidRuleTierAmountRangeRule(3.9, 3064.7),
      new ManualBidRuleTierCountryLengthRule(86400),
      new ManualBidRuleTierCodeLengthRule(255),
    ],
  );
}
