import { ApprovalPreference } from "./approval-preference.js";

/** A rule a approval preference must pass. Check returns its problems, or none. */
export interface ApprovalPreferenceRule {
  check(item: ApprovalPreference): string[];
}

export class ApprovalPreferenceRequiredLabelRule implements ApprovalPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalPreferenceLabelLengthRule implements ApprovalPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalPreferenceRequiredUtmSourceRule implements ApprovalPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalPreference): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalPreferenceCreatedAtRangeRule implements ApprovalPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalPreference): string[] {
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

/** Runs every rule of a approval preference. */
export class ApprovalPreferenceValidator {
  rules: ApprovalPreferenceRule[];

  constructor(rules: ApprovalPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalPreference[]): Map<string, string[]> {
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

export function defaultApprovalPreferenceValidator(): ApprovalPreferenceValidator {
  return new ApprovalPreferenceValidator(
    [
      new ApprovalPreferenceRequiredLabelRule("approval preference needs an entry"),
      new ApprovalPreferenceLabelLengthRule(3600),
      new ApprovalPreferenceRequiredUtmSourceRule("approval preference needs this field"),
      new ApprovalPreferenceCreatedAtRangeRule(64, 80),
    ],
  );
}
