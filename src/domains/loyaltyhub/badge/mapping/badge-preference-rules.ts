import { BadgePreference } from "./badge-preference.js";

/** A rule a badge preference must pass. Check returns its problems, or none. */
export interface BadgePreferenceRule {
  check(item: BadgePreference): string[];
}

export class BadgePreferenceRequiredCodeRule implements BadgePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgePreferenceCodeLengthRule implements BadgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgePreferenceAmountRangeRule implements BadgePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgePreference): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgePreferenceRequiredChannelRule implements BadgePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgePreference): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge preference. */
export class BadgePreferenceValidator {
  rules: BadgePreferenceRule[];

  constructor(rules: BadgePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BadgePreference): string[] {
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

  requireValid(item: BadgePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgePreference[]): Map<string, string[]> {
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

export function defaultBadgePreferenceValidator(): BadgePreferenceValidator {
  return new BadgePreferenceValidator(
    [
      new BadgePreferenceRequiredCodeRule("badge preference needs this field"),
      new BadgePreferenceCodeLengthRule(86400),
      new BadgePreferenceAmountRangeRule(7, 1729.5),
      new BadgePreferenceRequiredChannelRule("badge preference needs a value"),
    ],
  );
}
