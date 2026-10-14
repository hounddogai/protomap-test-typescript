import { ManualEnrollmentDigest } from "./manual-enrollment-digest.js";

/** A rule a manual enrollment digest must pass. Check returns its problems, or none. */
export interface ManualEnrollmentDigestRule {
  check(item: ManualEnrollmentDigest): string[];
}

export class ManualEnrollmentDigestRequiredCodeRule implements ManualEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEnrollmentDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEnrollmentDigestImpressionsRangeRule implements ManualEnrollmentDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualEnrollmentDigest): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualEnrollmentDigestRequiredLabelRule implements ManualEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEnrollmentDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEnrollmentDigestLabelLengthRule implements ManualEnrollmentDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEnrollmentDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualEnrollmentDigestRequiredCountryRule implements ManualEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEnrollmentDigest): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEnrollmentDigestCodePrefixRule implements ManualEnrollmentDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualEnrollmentDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual enrollment digest. */
export class ManualEnrollmentDigestValidator {
  rules: ManualEnrollmentDigestRule[];

  constructor(rules: ManualEnrollmentDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ManualEnrollmentDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualEnrollmentDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualEnrollmentDigest[]): Map<string, string[]> {
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

export function defaultManualEnrollmentDigestValidator(): ManualEnrollmentDigestValidator {
  return new ManualEnrollmentDigestValidator(
    [
      new ManualEnrollmentDigestRequiredCodeRule("manual enrollment digest needs this field"),
      new ManualEnrollmentDigestImpressionsRangeRule(255, 255),
      new ManualEnrollmentDigestRequiredLabelRule("manual enrollment digest needs this field"),
      new ManualEnrollmentDigestLabelLengthRule(32),
      new ManualEnrollmentDigestRequiredCountryRule("manual enrollment digest needs a value"),
      new ManualEnrollmentDigestCodePrefixRule("REF"),
    ],
  );
}
