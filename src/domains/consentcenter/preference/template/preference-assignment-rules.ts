import { PreferenceAssignment } from "./preference-assignment.js";

/** A rule a preference assignment must pass. Check returns its problems, or none. */
export interface PreferenceAssignmentRule {
  check(item: PreferenceAssignment): string[];
}

export class PreferenceAssignmentRequiredCodeRule implements PreferenceAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceAssignmentCreatedAtRangeRule implements PreferenceAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceAssignment): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceAssignmentCodeLengthRule implements PreferenceAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceAssignmentCodePrefixRule implements PreferenceAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a preference assignment. */
export class PreferenceAssignmentValidator {
  rules: PreferenceAssignmentRule[];

  constructor(rules: PreferenceAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceAssignment): string[] {
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

  requireValid(item: PreferenceAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceAssignment[]): Map<string, string[]> {
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

export function defaultPreferenceAssignmentValidator(): PreferenceAssignmentValidator {
  return new PreferenceAssignmentValidator(
    [
      new PreferenceAssignmentRequiredCodeRule("preference assignment needs this field"),
      new PreferenceAssignmentCreatedAtRangeRule(16, 86400),
      new PreferenceAssignmentCodeLengthRule(3600),
      new PreferenceAssignmentCodePrefixRule("REF"),
    ],
  );
}
