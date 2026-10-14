import { InsightDigest } from "./insight-digest.js";

/** A rule a insight digest must pass. Check returns its problems, or none. */
export interface InsightDigestRule {
  check(item: InsightDigest): string[];
}

export class InsightDigestThresholdRangeRule implements InsightDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightDigest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightDigestCodeLengthRule implements InsightDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightDigestChannelLengthRule implements InsightDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightDigest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a insight digest. */
export class InsightDigestValidator {
  rules: InsightDigestRule[];

  constructor(rules: InsightDigestRule[]) {
    this.rules = rules;
  }

  validate(item: InsightDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightDigest[]): Map<string, string[]> {
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

export function defaultInsightDigestValidator(): InsightDigestValidator {
  return new InsightDigestValidator(
    [
      new InsightDigestThresholdRangeRule(2.4, 270.9),
      new InsightDigestCodeLengthRule(3600),
      new InsightDigestChannelLengthRule(32),
    ],
  );
}
