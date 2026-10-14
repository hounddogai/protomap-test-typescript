import * as text from "../../../../kit/text.js";
import { LenientCohortGroup } from "./lenient-cohort-group.js";

/** A rule a lenient cohort group must pass. Check returns its problems, or none. */
export interface LenientCohortGroupRule {
  check(item: LenientCohortGroup): string[];
}

export class LenientCohortGroupRequiredContactEmailRule implements LenientCohortGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCohortGroup): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCohortGroupContactEmailLengthRule implements LenientCohortGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCohortGroup): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCohortGroupLabelLengthRule implements LenientCohortGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCohortGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCohortGroupAllowedReviewerRule implements LenientCohortGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientCohortGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is inconsistent`];
    return [];
  }
}

export class LenientCohortGroupRequiredCodeRule implements LenientCohortGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCohortGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient cohort group. */
export class LenientCohortGroupValidator {
  rules: LenientCohortGroupRule[];

  constructor(rules: LenientCohortGroupRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCohortGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCohortGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCohortGroup[]): Map<string, string[]> {
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

export function defaultLenientCohortGroupValidator(): LenientCohortGroupValidator {
  return new LenientCohortGroupValidator(
    [
      new LenientCohortGroupRequiredContactEmailRule("lenient cohort group needs this field"),
      new LenientCohortGroupContactEmailLengthRule(1000),
      new LenientCohortGroupLabelLengthRule(120),
      new LenientCohortGroupAllowedReviewerRule(["weighted", "batched"]),
      new LenientCohortGroupRequiredCodeRule("lenient cohort group needs an entry"),
    ],
  );
}
