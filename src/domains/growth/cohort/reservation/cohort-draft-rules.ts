import { CohortDraft } from "./cohort-draft.js";

/** A rule a cohort draft must pass. Check returns its problems, or none. */
export interface CohortDraftRule {
  check(item: CohortDraft): string[];
}

export class CohortDraftPhoneLengthRule implements CohortDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortDraft): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortDraftCreatedAtRangeRule implements CohortDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortDraft): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortDraftCodePrefixRule implements CohortDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a cohort draft. */
export class CohortDraftValidator {
  rules: CohortDraftRule[];

  constructor(rules: CohortDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CohortDraft): string[] {
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

  requireValid(item: CohortDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortDraft[]): Map<string, string[]> {
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

export function defaultCohortDraftValidator(): CohortDraftValidator {
  return new CohortDraftValidator(
    [
      new CohortDraftPhoneLengthRule(32),
      new CohortDraftCreatedAtRangeRule(120, 3600),
      new CohortDraftCodePrefixRule("REF"),
    ],
  );
}
