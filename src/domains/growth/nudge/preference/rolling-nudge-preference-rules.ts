import { RollingNudgePreference } from "./rolling-nudge-preference.js";

/** A rule a rolling nudge preference must pass. Check returns its problems, or none. */
export interface RollingNudgePreferenceRule {
  check(item: RollingNudgePreference): string[];
}

export class RollingNudgePreferenceCodePrefixRule implements RollingNudgePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingNudgePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingNudgePreferenceLabelLengthRule implements RollingNudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgePreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgePreferenceUtmSourceLengthRule implements RollingNudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgePreference): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgePreferenceUnitLengthRule implements RollingNudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgePreference): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgePreferenceRequiredUtmSourceRule implements RollingNudgePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgePreference): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RollingNudgePreferenceCreatedAtRangeRule implements RollingNudgePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgePreference): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling nudge preference. */
export class RollingNudgePreferenceValidator {
  rules: RollingNudgePreferenceRule[];

  constructor(rules: RollingNudgePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgePreference): string[] {
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

  requireValid(item: RollingNudgePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgePreference[]): Map<string, string[]> {
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

export function defaultRollingNudgePreferenceValidator(): RollingNudgePreferenceValidator {
  return new RollingNudgePreferenceValidator(
    [
      new RollingNudgePreferenceCodePrefixRule("Q"),
      new RollingNudgePreferenceLabelLengthRule(16),
      new RollingNudgePreferenceUtmSourceLengthRule(3600),
      new RollingNudgePreferenceUnitLengthRule(16),
      new RollingNudgePreferenceRequiredUtmSourceRule("rolling nudge preference needs this field"),
      new RollingNudgePreferenceCreatedAtRangeRule(80, 255),
    ],
  );
}
