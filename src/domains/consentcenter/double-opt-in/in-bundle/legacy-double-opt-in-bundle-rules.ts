import { LegacyDoubleOptInBundle } from "./legacy-double-opt-in-bundle.js";

/** A rule a legacy double opt in bundle must pass. Check returns its problems, or none. */
export interface LegacyDoubleOptInBundleRule {
  check(item: LegacyDoubleOptInBundle): string[];
}

export class LegacyDoubleOptInBundleClicksRangeRule implements LegacyDoubleOptInBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDoubleOptInBundle): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyDoubleOptInBundleChecksumLengthRule implements LegacyDoubleOptInBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInBundle): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDoubleOptInBundleRequiredTitleRule implements LegacyDoubleOptInBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy double opt in bundle. */
export class LegacyDoubleOptInBundleValidator {
  rules: LegacyDoubleOptInBundleRule[];

  constructor(rules: LegacyDoubleOptInBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDoubleOptInBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyDoubleOptInBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDoubleOptInBundle[]): Map<string, string[]> {
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

export function defaultLegacyDoubleOptInBundleValidator(): LegacyDoubleOptInBundleValidator {
  return new LegacyDoubleOptInBundleValidator(
    [
      new LegacyDoubleOptInBundleClicksRangeRule(120, 1000),
      new LegacyDoubleOptInBundleChecksumLengthRule(80),
      new LegacyDoubleOptInBundleRequiredTitleRule("legacy double opt in bundle needs an entry"),
    ],
  );
}
