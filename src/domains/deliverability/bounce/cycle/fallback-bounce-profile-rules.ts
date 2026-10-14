import { FallbackBounceProfile } from "./fallback-bounce-profile.js";

/** A rule a fallback bounce profile must pass. Check returns its problems, or none. */
export interface FallbackBounceProfileRule {
  check(item: FallbackBounceProfile): string[];
}

export class FallbackBounceProfileRequiredVariantRule implements FallbackBounceProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBounceProfile): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBounceProfileCodeLengthRule implements FallbackBounceProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBounceProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBounceProfileArchivedGuardRule implements FallbackBounceProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackBounceProfile): string[] {
    if (item.archived && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class FallbackBounceProfileGraceDaysRangeRule implements FallbackBounceProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBounceProfile): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackBounceProfileRequiredNameRule implements FallbackBounceProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBounceProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback bounce profile. */
export class FallbackBounceProfileValidator {
  rules: FallbackBounceProfileRule[];

  constructor(rules: FallbackBounceProfileRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBounceProfile): string[] {
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

  requireValid(item: FallbackBounceProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBounceProfile[]): Map<string, string[]> {
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

export function defaultFallbackBounceProfileValidator(): FallbackBounceProfileValidator {
  return new FallbackBounceProfileValidator(
    [
      new FallbackBounceProfileRequiredVariantRule("fallback bounce profile needs a value"),
      new FallbackBounceProfileCodeLengthRule(64),
      new FallbackBounceProfileArchivedGuardRule(1000),
      new FallbackBounceProfileGraceDaysRangeRule(32, 32),
      new FallbackBounceProfileRequiredNameRule("fallback bounce profile needs an entry"),
    ],
  );
}
