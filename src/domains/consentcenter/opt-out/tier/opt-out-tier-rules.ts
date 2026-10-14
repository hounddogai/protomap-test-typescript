import { OptOutTier } from "./opt-out-tier.js";

/** A rule a opt out tier must pass. Check returns its problems, or none. */
export interface OptOutTierRule {
  check(item: OptOutTier): string[];
}

export class OptOutTierPinnedGuardRule implements OptOutTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: OptOutTier): string[] {
    if (item.pinned && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class OptOutTierTitleLengthRule implements OptOutTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutTierCodePrefixRule implements OptOutTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a opt out tier. */
export class OptOutTierValidator {
  rules: OptOutTierRule[];

  constructor(rules: OptOutTierRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutTier): string[] {
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

  requireValid(item: OptOutTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutTier[]): Map<string, string[]> {
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

export function defaultOptOutTierValidator(): OptOutTierValidator {
  return new OptOutTierValidator(
    [
      new OptOutTierPinnedGuardRule(86400),
      new OptOutTierTitleLengthRule(1000),
      new OptOutTierCodePrefixRule("OPS"),
    ],
  );
}
