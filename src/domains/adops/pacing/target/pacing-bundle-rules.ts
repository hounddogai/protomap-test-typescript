import { PacingBundle } from "./pacing-bundle.js";

/** A rule a pacing bundle must pass. Check returns its problems, or none. */
export interface PacingBundleRule {
  check(item: PacingBundle): string[];
}

export class PacingBundleRequiredPhoneRule implements PacingBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingBundle): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PacingBundleLabelLengthRule implements PacingBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingBundlePhoneLengthRule implements PacingBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingBundle): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing bundle. */
export class PacingBundleValidator {
  rules: PacingBundleRule[];

  constructor(rules: PacingBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PacingBundle): string[] {
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

  requireValid(item: PacingBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingBundle[]): Map<string, string[]> {
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

export function defaultPacingBundleValidator(): PacingBundleValidator {
  return new PacingBundleValidator(
    [
      new PacingBundleRequiredPhoneRule("pacing bundle needs this field"),
      new PacingBundleLabelLengthRule(86400),
      new PacingBundlePhoneLengthRule(3600),
    ],
  );
}
