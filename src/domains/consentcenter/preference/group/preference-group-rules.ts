import * as text from "../../../../kit/text.js";
import { PreferenceGroup } from "./preference-group.js";

/** A rule a preference group must pass. Check returns its problems, or none. */
export interface PreferenceGroupRule {
  check(item: PreferenceGroup): string[];
}

export class PreferenceGroupTitleLengthRule implements PreferenceGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceGroupAllowedCohortRule implements PreferenceGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is out of range`];
    return [];
  }
}

export class PreferenceGroupCohortLengthRule implements PreferenceGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceGroup): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceGroupRequiredCodeRule implements PreferenceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceGroupRequiredReviewerRule implements PreferenceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceGroup): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceGroupRequiredTitleRule implements PreferenceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a preference group. */
export class PreferenceGroupValidator {
  rules: PreferenceGroupRule[];

  constructor(rules: PreferenceGroupRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceGroup[]): Map<string, string[]> {
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

export function defaultPreferenceGroupValidator(): PreferenceGroupValidator {
  return new PreferenceGroupValidator(
    [
      new PreferenceGroupTitleLengthRule(16),
      new PreferenceGroupAllowedCohortRule([]),
      new PreferenceGroupCohortLengthRule(3600),
      new PreferenceGroupRequiredCodeRule("preference group needs an entry"),
      new PreferenceGroupRequiredReviewerRule("preference group needs an entry"),
      new PreferenceGroupRequiredTitleRule("preference group needs a value"),
    ],
  );
}
