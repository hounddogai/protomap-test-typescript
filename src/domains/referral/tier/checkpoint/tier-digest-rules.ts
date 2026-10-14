import { TierDigest } from "./tier-digest.js";

/** A rule a tier digest must pass. Check returns its problems, or none. */
export interface TierDigestRule {
  check(item: TierDigest): string[];
}

export class TierDigestLabelLengthRule implements TierDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierDigestRequiredCodeRule implements TierDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierDigestRevisionRangeRule implements TierDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierDigest): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tier digest. */
export class TierDigestValidator {
  rules: TierDigestRule[];

  constructor(rules: TierDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TierDigest): string[] {
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

  requireValid(item: TierDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierDigest[]): Map<string, string[]> {
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

export function defaultTierDigestValidator(): TierDigestValidator {
  return new TierDigestValidator(
    [
      new TierDigestLabelLengthRule(80),
      new TierDigestRequiredCodeRule("tier digest needs a value"),
      new TierDigestRevisionRangeRule(16, 80),
    ],
  );
}
