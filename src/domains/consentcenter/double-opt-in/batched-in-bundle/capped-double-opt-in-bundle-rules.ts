import { CappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

/** A rule a capped double opt in bundle must pass. Check returns its problems, or none. */
export interface CappedDoubleOptInBundleRule {
  check(item: CappedDoubleOptInBundle): string[];
}

export class CappedDoubleOptInBundleCodeLengthRule implements CappedDoubleOptInBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDoubleOptInBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDoubleOptInBundleApprovedGuardRule implements CappedDoubleOptInBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedDoubleOptInBundle): string[] {
    if (item.approved && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class CappedDoubleOptInBundleCodePrefixRule implements CappedDoubleOptInBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedDoubleOptInBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedDoubleOptInBundleMaximumRangeRule implements CappedDoubleOptInBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedDoubleOptInBundle): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped double opt in bundle. */
export class CappedDoubleOptInBundleValidator {
  rules: CappedDoubleOptInBundleRule[];

  constructor(rules: CappedDoubleOptInBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDoubleOptInBundle): string[] {
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

  requireValid(item: CappedDoubleOptInBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDoubleOptInBundle[]): Map<string, string[]> {
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

export function defaultCappedDoubleOptInBundleValidator(): CappedDoubleOptInBundleValidator {
  return new CappedDoubleOptInBundleValidator(
    [
      new CappedDoubleOptInBundleCodeLengthRule(16),
      new CappedDoubleOptInBundleApprovedGuardRule(120),
      new CappedDoubleOptInBundleCodePrefixRule("Q"),
      new CappedDoubleOptInBundleMaximumRangeRule(1.3, 1692.2),
    ],
  );
}
