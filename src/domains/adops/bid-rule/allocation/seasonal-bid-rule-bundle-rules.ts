import * as text from "../../../../kit/text.js";
import { SeasonalBidRuleBundle } from "./seasonal-bid-rule-bundle.js";

/** A rule a seasonal bid rule bundle must pass. Check returns its problems, or none. */
export interface SeasonalBidRuleBundleRule {
  check(item: SeasonalBidRuleBundle): string[];
}

export class SeasonalBidRuleBundleNameLengthRule implements SeasonalBidRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBidRuleBundleCodeLengthRule implements SeasonalBidRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBidRuleBundleCodePrefixRule implements SeasonalBidRuleBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalBidRuleBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalBidRuleBundleAllowedCodeRule implements SeasonalBidRuleBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalBidRuleBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class SeasonalBidRuleBundleMaximumRangeRule implements SeasonalBidRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBidRuleBundle): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalBidRuleBundleRequiredLocaleRule implements SeasonalBidRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBidRuleBundle): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal bid rule bundle. */
export class SeasonalBidRuleBundleValidator {
  rules: SeasonalBidRuleBundleRule[];

  constructor(rules: SeasonalBidRuleBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBidRuleBundle): string[] {
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

  requireValid(item: SeasonalBidRuleBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBidRuleBundle[]): Map<string, string[]> {
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

export function defaultSeasonalBidRuleBundleValidator(): SeasonalBidRuleBundleValidator {
  return new SeasonalBidRuleBundleValidator(
    [
      new SeasonalBidRuleBundleNameLengthRule(64),
      new SeasonalBidRuleBundleCodeLengthRule(32),
      new SeasonalBidRuleBundleCodePrefixRule("REF"),
      new SeasonalBidRuleBundleAllowedCodeRule([]),
      new SeasonalBidRuleBundleMaximumRangeRule(9.3, 3944.7),
      new SeasonalBidRuleBundleRequiredLocaleRule("seasonal bid rule bundle needs an entry"),
    ],
  );
}
