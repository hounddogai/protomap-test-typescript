import * as text from "../../../../kit/text.js";
import { TieredModelTier } from "./tiered-model-tier.js";

/** A rule a tiered model tier must pass. Check returns its problems, or none. */
export interface TieredModelTierRule {
  check(item: TieredModelTier): string[];
}

export class TieredModelTierCodePrefixRule implements TieredModelTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredModelTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredModelTierRequiredCategoryRule implements TieredModelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredModelTier): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class TieredModelTierRequiredCodeRule implements TieredModelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredModelTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredModelTierCodeLengthRule implements TieredModelTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredModelTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredModelTierAllowedNameRule implements TieredModelTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredModelTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

/** Runs every rule of a tiered model tier. */
export class TieredModelTierValidator {
  rules: TieredModelTierRule[];

  constructor(rules: TieredModelTierRule[]) {
    this.rules = rules;
  }

  validate(item: TieredModelTier): string[] {
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

  requireValid(item: TieredModelTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredModelTier[]): Map<string, string[]> {
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

export function defaultTieredModelTierValidator(): TieredModelTierValidator {
  return new TieredModelTierValidator(
    [
      new TieredModelTierCodePrefixRule("OPS"),
      new TieredModelTierRequiredCategoryRule("tiered model tier needs an entry"),
      new TieredModelTierRequiredCodeRule("tiered model tier needs an entry"),
      new TieredModelTierCodeLengthRule(64),
      new TieredModelTierAllowedNameRule(["pending"]),
    ],
  );
}
