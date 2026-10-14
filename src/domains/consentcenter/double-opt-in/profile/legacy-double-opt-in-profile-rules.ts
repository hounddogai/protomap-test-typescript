import { LegacyDoubleOptInProfile } from "./legacy-double-opt-in-profile.js";

/** A rule a legacy double opt in profile must pass. Check returns its problems, or none. */
export interface LegacyDoubleOptInProfileRule {
  check(item: LegacyDoubleOptInProfile): string[];
}

export class LegacyDoubleOptInProfileQuantityRangeRule implements LegacyDoubleOptInProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDoubleOptInProfile): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyDoubleOptInProfileCodeLengthRule implements LegacyDoubleOptInProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDoubleOptInProfileChannelLengthRule implements LegacyDoubleOptInProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInProfile): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy double opt in profile. */
export class LegacyDoubleOptInProfileValidator {
  rules: LegacyDoubleOptInProfileRule[];

  constructor(rules: LegacyDoubleOptInProfileRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDoubleOptInProfile): string[] {
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

  requireValid(item: LegacyDoubleOptInProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDoubleOptInProfile[]): Map<string, string[]> {
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

export function defaultLegacyDoubleOptInProfileValidator(): LegacyDoubleOptInProfileValidator {
  return new LegacyDoubleOptInProfileValidator(
    [
      new LegacyDoubleOptInProfileQuantityRangeRule(1000, 86400),
      new LegacyDoubleOptInProfileCodeLengthRule(255),
      new LegacyDoubleOptInProfileChannelLengthRule(3600),
    ],
  );
}
