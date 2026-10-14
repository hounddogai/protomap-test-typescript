import { BranchPreference } from "./branch-preference.js";

/** A rule a branch preference must pass. Check returns its problems, or none. */
export interface BranchPreferenceRule {
  check(item: BranchPreference): string[];
}

export class BranchPreferenceRequiredCodeRule implements BranchPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchPreferenceNotesLengthRule implements BranchPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchPreference): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchPreferenceCodePrefixRule implements BranchPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchPreferenceRequiredNotesRule implements BranchPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchPreference): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class BranchPreferenceFloorValueRangeRule implements BranchPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchPreference): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a branch preference. */
export class BranchPreferenceValidator {
  rules: BranchPreferenceRule[];

  constructor(rules: BranchPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BranchPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchPreference[]): Map<string, string[]> {
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

export function defaultBranchPreferenceValidator(): BranchPreferenceValidator {
  return new BranchPreferenceValidator(
    [
      new BranchPreferenceRequiredCodeRule("branch preference needs this field"),
      new BranchPreferenceNotesLengthRule(16),
      new BranchPreferenceCodePrefixRule("X"),
      new BranchPreferenceRequiredNotesRule("branch preference needs an entry"),
      new BranchPreferenceFloorValueRangeRule(6.2, 1865.6),
    ],
  );
}
