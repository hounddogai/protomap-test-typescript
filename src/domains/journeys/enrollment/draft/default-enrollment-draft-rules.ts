import { DefaultEnrollmentDraft } from "./default-enrollment-draft.js";

/** A rule a default enrollment draft must pass. Check returns its problems, or none. */
export interface DefaultEnrollmentDraftRule {
  check(item: DefaultEnrollmentDraft): string[];
}

export class DefaultEnrollmentDraftActiveGuardRule implements DefaultEnrollmentDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultEnrollmentDraft): string[] {
    if (item.active && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while active`];
    return [];
  }
}

export class DefaultEnrollmentDraftRequiredLabelRule implements DefaultEnrollmentDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultEnrollmentDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultEnrollmentDraftCodeLengthRule implements DefaultEnrollmentDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultEnrollmentDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultEnrollmentDraftMinimumRangeRule implements DefaultEnrollmentDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultEnrollmentDraft): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default enrollment draft. */
export class DefaultEnrollmentDraftValidator {
  rules: DefaultEnrollmentDraftRule[];

  constructor(rules: DefaultEnrollmentDraftRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultEnrollmentDraft): string[] {
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

  requireValid(item: DefaultEnrollmentDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultEnrollmentDraft[]): Map<string, string[]> {
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

export function defaultDefaultEnrollmentDraftValidator(): DefaultEnrollmentDraftValidator {
  return new DefaultEnrollmentDraftValidator(
    [
      new DefaultEnrollmentDraftActiveGuardRule(0.1),
      new DefaultEnrollmentDraftRequiredLabelRule("default enrollment draft needs an entry"),
      new DefaultEnrollmentDraftCodeLengthRule(86400),
      new DefaultEnrollmentDraftMinimumRangeRule(0.9, 2698.2),
    ],
  );
}
