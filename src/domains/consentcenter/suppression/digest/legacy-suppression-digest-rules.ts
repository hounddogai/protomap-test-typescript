import { LegacySuppressionDigest } from "./legacy-suppression-digest.js";

/** A rule a legacy suppression digest must pass. Check returns its problems, or none. */
export interface LegacySuppressionDigestRule {
  check(item: LegacySuppressionDigest): string[];
}

export class LegacySuppressionDigestMinimumRangeRule implements LegacySuppressionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySuppressionDigest): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacySuppressionDigestLabelLengthRule implements LegacySuppressionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySuppressionDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySuppressionDigestCapacityRangeRule implements LegacySuppressionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySuppressionDigest): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacySuppressionDigestCodeLengthRule implements LegacySuppressionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySuppressionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySuppressionDigestRequiredCodeRule implements LegacySuppressionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySuppressionDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySuppressionDigestCeilingRangeRule implements LegacySuppressionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySuppressionDigest): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy suppression digest. */
export class LegacySuppressionDigestValidator {
  rules: LegacySuppressionDigestRule[];

  constructor(rules: LegacySuppressionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySuppressionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacySuppressionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySuppressionDigest[]): Map<string, string[]> {
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

export function defaultLegacySuppressionDigestValidator(): LegacySuppressionDigestValidator {
  return new LegacySuppressionDigestValidator(
    [
      new LegacySuppressionDigestMinimumRangeRule(1.5, 3302.9),
      new LegacySuppressionDigestLabelLengthRule(80),
      new LegacySuppressionDigestCapacityRangeRule(3600, 3600),
      new LegacySuppressionDigestCodeLengthRule(16),
      new LegacySuppressionDigestRequiredCodeRule("legacy suppression digest needs an entry"),
      new LegacySuppressionDigestCeilingRangeRule(6.8, 2488.4),
    ],
  );
}
