import * as text from "../../../../kit/text.js";
import { TieredChallengeTier } from "./tiered-challenge-tier.js";

/** A rule a tiered challenge tier must pass. Check returns its problems, or none. */
export interface TieredChallengeTierRule {
  check(item: TieredChallengeTier): string[];
}

export class TieredChallengeTierRequiredNameRule implements TieredChallengeTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredChallengeTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredChallengeTierAllowedNameRule implements TieredChallengeTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredChallengeTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class TieredChallengeTierCodePrefixRule implements TieredChallengeTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredChallengeTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredChallengeTierCodeLengthRule implements TieredChallengeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredChallengeTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredChallengeTierRequiredLabelRule implements TieredChallengeTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredChallengeTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredChallengeTierMarginRangeRule implements TieredChallengeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredChallengeTier): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered challenge tier. */
export class TieredChallengeTierValidator {
  rules: TieredChallengeTierRule[];

  constructor(rules: TieredChallengeTierRule[]) {
    this.rules = rules;
  }

  validate(item: TieredChallengeTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredChallengeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredChallengeTier[]): Map<string, string[]> {
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

export function defaultTieredChallengeTierValidator(): TieredChallengeTierValidator {
  return new TieredChallengeTierValidator(
    [
      new TieredChallengeTierRequiredNameRule("tiered challenge tier needs an entry"),
      new TieredChallengeTierAllowedNameRule(["pending", "weighted", "regional"]),
      new TieredChallengeTierCodePrefixRule("REF"),
      new TieredChallengeTierCodeLengthRule(16),
      new TieredChallengeTierRequiredLabelRule("tiered challenge tier needs this field"),
      new TieredChallengeTierMarginRangeRule(0.5, 4400.3),
    ],
  );
}
