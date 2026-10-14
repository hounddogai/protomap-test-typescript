import { FallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

/** A rule a fallback enrollment baseline must pass. Check returns its problems, or none. */
export interface FallbackEnrollmentBaselineRule {
  check(item: FallbackEnrollmentBaseline): string[];
}

export class FallbackEnrollmentBaselineCodePrefixRule implements FallbackEnrollmentBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackEnrollmentBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackEnrollmentBaselineActiveGuardRule implements FallbackEnrollmentBaselineRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackEnrollmentBaseline): string[] {
    if (item.active && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while active`];
    return [];
  }
}

export class FallbackEnrollmentBaselineCeilingRangeRule implements FallbackEnrollmentBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackEnrollmentBaseline): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback enrollment baseline. */
export class FallbackEnrollmentBaselineValidator {
  rules: FallbackEnrollmentBaselineRule[];

  constructor(rules: FallbackEnrollmentBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackEnrollmentBaseline): string[] {
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

  requireValid(item: FallbackEnrollmentBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackEnrollmentBaseline[]): Map<string, string[]> {
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

export function defaultFallbackEnrollmentBaselineValidator(): FallbackEnrollmentBaselineValidator {
  return new FallbackEnrollmentBaselineValidator(
    [
      new FallbackEnrollmentBaselineCodePrefixRule("OPS"),
      new FallbackEnrollmentBaselineActiveGuardRule(5.8),
      new FallbackEnrollmentBaselineCeilingRangeRule(5.8, 4401.7),
    ],
  );
}
