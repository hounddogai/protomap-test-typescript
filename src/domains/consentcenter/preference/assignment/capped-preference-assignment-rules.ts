import { CappedPreferenceAssignment } from "./capped-preference-assignment.js";

/** A rule a capped preference assignment must pass. Check returns its problems, or none. */
export interface CappedPreferenceAssignmentRule {
  check(item: CappedPreferenceAssignment): string[];
}

export class CappedPreferenceAssignmentRequiredLabelRule implements CappedPreferenceAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPreferenceAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPreferenceAssignmentRatioRangeRule implements CappedPreferenceAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPreferenceAssignment): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedPreferenceAssignmentCodePrefixRule implements CappedPreferenceAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedPreferenceAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedPreferenceAssignmentLabelLengthRule implements CappedPreferenceAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPreferenceAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPreferenceAssignmentCodeLengthRule implements CappedPreferenceAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPreferenceAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped preference assignment. */
export class CappedPreferenceAssignmentValidator {
  rules: CappedPreferenceAssignmentRule[];

  constructor(rules: CappedPreferenceAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPreferenceAssignment): string[] {
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

  requireValid(item: CappedPreferenceAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPreferenceAssignment[]): Map<string, string[]> {
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

export function defaultCappedPreferenceAssignmentValidator(): CappedPreferenceAssignmentValidator {
  return new CappedPreferenceAssignmentValidator(
    [
      new CappedPreferenceAssignmentRequiredLabelRule("capped preference assignment needs an entry"),
      new CappedPreferenceAssignmentRatioRangeRule(4.4, 289),
      new CappedPreferenceAssignmentCodePrefixRule("X"),
      new CappedPreferenceAssignmentLabelLengthRule(1000),
      new CappedPreferenceAssignmentCodeLengthRule(64),
    ],
  );
}
