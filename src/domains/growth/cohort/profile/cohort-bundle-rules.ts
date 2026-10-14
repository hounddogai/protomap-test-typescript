import { CohortBundle } from "./cohort-bundle.js";

/** A rule a cohort bundle must pass. Check returns its problems, or none. */
export interface CohortBundleRule {
  check(item: CohortBundle): string[];
}

export class CohortBundleCreatedAtRangeRule implements CohortBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortBundle): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortBundleLabelLengthRule implements CohortBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortBundleCodePrefixRule implements CohortBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortBundleRequiredCodeRule implements CohortBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortBundleRequiredNotesRule implements CohortBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortBundle): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort bundle. */
export class CohortBundleValidator {
  rules: CohortBundleRule[];

  constructor(rules: CohortBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CohortBundle): string[] {
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

  requireValid(item: CohortBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortBundle[]): Map<string, string[]> {
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

export function defaultCohortBundleValidator(): CohortBundleValidator {
  return new CohortBundleValidator(
    [
      new CohortBundleCreatedAtRangeRule(16, 3600),
      new CohortBundleLabelLengthRule(32),
      new CohortBundleCodePrefixRule("Q"),
      new CohortBundleRequiredCodeRule("cohort bundle needs an entry"),
      new CohortBundleRequiredNotesRule("cohort bundle needs this field"),
    ],
  );
}
