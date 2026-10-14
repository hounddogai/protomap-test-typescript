import { RollingConversionPreference } from "./rolling-conversion-preference.js";

/** A rule a rolling conversion preference must pass. Check returns its problems, or none. */
export interface RollingConversionPreferenceRule {
  check(item: RollingConversionPreference): string[];
}

export class RollingConversionPreferenceLabelLengthRule implements RollingConversionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingConversionPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingConversionPreferenceCodeLengthRule implements RollingConversionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingConversionPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingConversionPreferenceRequiredLabelRule implements RollingConversionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingConversionPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingConversionPreferenceThresholdRangeRule implements RollingConversionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingConversionPreference): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingConversionPreferenceUtmSourceLengthRule implements RollingConversionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingConversionPreference): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling conversion preference. */
export class RollingConversionPreferenceValidator {
  rules: RollingConversionPreferenceRule[];

  constructor(rules: RollingConversionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingConversionPreference): string[] {
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

  requireValid(item: RollingConversionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingConversionPreference[]): Map<string, string[]> {
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

export function defaultRollingConversionPreferenceValidator(): RollingConversionPreferenceValidator {
  return new RollingConversionPreferenceValidator(
    [
      new RollingConversionPreferenceLabelLengthRule(3600),
      new RollingConversionPreferenceCodeLengthRule(120),
      new RollingConversionPreferenceRequiredLabelRule("rolling conversion preference needs an entry"),
      new RollingConversionPreferenceThresholdRangeRule(6.4, 3675.3),
      new RollingConversionPreferenceUtmSourceLengthRule(32),
    ],
  );
}
