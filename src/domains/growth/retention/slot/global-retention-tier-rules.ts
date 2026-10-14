import * as text from "../../../../kit/text.js";
import { GlobalRetentionTier } from "./global-retention-tier.js";

/** A rule a global retention tier must pass. Check returns its problems, or none. */
export interface GlobalRetentionTierRule {
  check(item: GlobalRetentionTier): string[];
}

export class GlobalRetentionTierAllowedRegionRule implements GlobalRetentionTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalRetentionTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is inconsistent`];
    return [];
  }
}

export class GlobalRetentionTierRevisionRangeRule implements GlobalRetentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionTier): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalRetentionTierRequiredTitleRule implements GlobalRetentionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionTierRegionLengthRule implements GlobalRetentionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionTier): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRetentionTierCodePrefixRule implements GlobalRetentionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalRetentionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global retention tier. */
export class GlobalRetentionTierValidator {
  rules: GlobalRetentionTierRule[];

  constructor(rules: GlobalRetentionTierRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRetentionTier): string[] {
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

  requireValid(item: GlobalRetentionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRetentionTier[]): Map<string, string[]> {
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

export function defaultGlobalRetentionTierValidator(): GlobalRetentionTierValidator {
  return new GlobalRetentionTierValidator(
    [
      new GlobalRetentionTierAllowedRegionRule(["fallback", "tiered"]),
      new GlobalRetentionTierRevisionRangeRule(255, 86400),
      new GlobalRetentionTierRequiredTitleRule("global retention tier needs a value"),
      new GlobalRetentionTierRegionLengthRule(32),
      new GlobalRetentionTierCodePrefixRule("ACM"),
    ],
  );
}
