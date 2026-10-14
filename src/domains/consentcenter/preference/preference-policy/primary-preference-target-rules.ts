import { PrimaryPreferenceTarget } from "./primary-preference-target.js";

/** A rule a primary preference target must pass. Check returns its problems, or none. */
export interface PrimaryPreferenceTargetRule {
  check(item: PrimaryPreferenceTarget): string[];
}

export class PrimaryPreferenceTargetCodeLengthRule implements PrimaryPreferenceTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPreferenceTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPreferenceTargetRequiredTitleRule implements PrimaryPreferenceTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPreferenceTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPreferenceTargetMaximumRangeRule implements PrimaryPreferenceTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPreferenceTarget): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary preference target. */
export class PrimaryPreferenceTargetValidator {
  rules: PrimaryPreferenceTargetRule[];

  constructor(rules: PrimaryPreferenceTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPreferenceTarget): string[] {
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

  requireValid(item: PrimaryPreferenceTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPreferenceTarget[]): Map<string, string[]> {
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

export function defaultPrimaryPreferenceTargetValidator(): PrimaryPreferenceTargetValidator {
  return new PrimaryPreferenceTargetValidator(
    [
      new PrimaryPreferenceTargetCodeLengthRule(32),
      new PrimaryPreferenceTargetRequiredTitleRule("primary preference target needs a value"),
      new PrimaryPreferenceTargetMaximumRangeRule(2.2, 448.2),
    ],
  );
}
