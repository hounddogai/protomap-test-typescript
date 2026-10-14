import { PreferenceTarget } from "./preference-target.js";

/** A rule a preference target must pass. Check returns its problems, or none. */
export interface PreferenceTargetRule {
  check(item: PreferenceTarget): string[];
}

export class PreferenceTargetRequiredNotesRule implements PreferenceTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceTarget): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceTargetRequiredCodeRule implements PreferenceTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceTargetLabelLengthRule implements PreferenceTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a preference target. */
export class PreferenceTargetValidator {
  rules: PreferenceTargetRule[];

  constructor(rules: PreferenceTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceTarget): string[] {
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

  requireValid(item: PreferenceTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceTarget[]): Map<string, string[]> {
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

export function defaultPreferenceTargetValidator(): PreferenceTargetValidator {
  return new PreferenceTargetValidator(
    [
      new PreferenceTargetRequiredNotesRule("preference target needs an entry"),
      new PreferenceTargetRequiredCodeRule("preference target needs this field"),
      new PreferenceTargetLabelLengthRule(120),
    ],
  );
}
