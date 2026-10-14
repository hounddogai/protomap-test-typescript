import { FallbackBounceBaseline } from "./fallback-bounce-baseline.js";

/** A rule a fallback bounce baseline must pass. Check returns its problems, or none. */
export interface FallbackBounceBaselineRule {
  check(item: FallbackBounceBaseline): string[];
}

export class FallbackBounceBaselineClicksRangeRule implements FallbackBounceBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBounceBaseline): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackBounceBaselineCodePrefixRule implements FallbackBounceBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackBounceBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackBounceBaselinePinnedGuardRule implements FallbackBounceBaselineRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackBounceBaseline): string[] {
    if (item.pinned && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class FallbackBounceBaselineTitleLengthRule implements FallbackBounceBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBounceBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback bounce baseline. */
export class FallbackBounceBaselineValidator {
  rules: FallbackBounceBaselineRule[];

  constructor(rules: FallbackBounceBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBounceBaseline): string[] {
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

  requireValid(item: FallbackBounceBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBounceBaseline[]): Map<string, string[]> {
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

export function defaultFallbackBounceBaselineValidator(): FallbackBounceBaselineValidator {
  return new FallbackBounceBaselineValidator(
    [
      new FallbackBounceBaselineClicksRangeRule(32, 3600),
      new FallbackBounceBaselineCodePrefixRule("REF"),
      new FallbackBounceBaselinePinnedGuardRule(1.6),
      new FallbackBounceBaselineTitleLengthRule(32),
    ],
  );
}
