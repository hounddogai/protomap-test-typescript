import { CohortGroup } from "./cohort-group.js";

/** A rule a cohort group must pass. Check returns its problems, or none. */
export interface CohortGroupRule {
  check(item: CohortGroup): string[];
}

export class CohortGroupRequiredPhoneRule implements CohortGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortGroup): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class CohortGroupPhoneLengthRule implements CohortGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortGroup): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortGroupLabelLengthRule implements CohortGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortGroupTitleLengthRule implements CohortGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortGroupRequiredCodeRule implements CohortGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort group. */
export class CohortGroupValidator {
  rules: CohortGroupRule[];

  constructor(rules: CohortGroupRule[]) {
    this.rules = rules;
  }

  validate(item: CohortGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortGroup[]): Map<string, string[]> {
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

export function defaultCohortGroupValidator(): CohortGroupValidator {
  return new CohortGroupValidator(
    [
      new CohortGroupRequiredPhoneRule("cohort group needs an entry"),
      new CohortGroupPhoneLengthRule(32),
      new CohortGroupLabelLengthRule(32),
      new CohortGroupTitleLengthRule(86400),
      new CohortGroupRequiredCodeRule("cohort group needs a value"),
    ],
  );
}
