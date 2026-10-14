import { TieredReplyPreference } from "./tiered-reply-preference.js";

/** A rule a tiered reply preference must pass. Check returns its problems, or none. */
export interface TieredReplyPreferenceRule {
  check(item: TieredReplyPreference): string[];
}

export class TieredReplyPreferenceFloorValueRangeRule implements TieredReplyPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredReplyPreference): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredReplyPreferenceRequiredNameRule implements TieredReplyPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredReplyPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredReplyPreferenceUnitLengthRule implements TieredReplyPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReplyPreference): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReplyPreferenceAudienceIdLengthRule implements TieredReplyPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReplyPreference): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered reply preference. */
export class TieredReplyPreferenceValidator {
  rules: TieredReplyPreferenceRule[];

  constructor(rules: TieredReplyPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredReplyPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredReplyPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredReplyPreference[]): Map<string, string[]> {
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

export function defaultTieredReplyPreferenceValidator(): TieredReplyPreferenceValidator {
  return new TieredReplyPreferenceValidator(
    [
      new TieredReplyPreferenceFloorValueRangeRule(5.3, 87.4),
      new TieredReplyPreferenceRequiredNameRule("tiered reply preference needs this field"),
      new TieredReplyPreferenceUnitLengthRule(86400),
      new TieredReplyPreferenceAudienceIdLengthRule(255),
    ],
  );
}
