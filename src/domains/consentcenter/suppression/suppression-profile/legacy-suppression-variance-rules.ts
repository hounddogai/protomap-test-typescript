import { LegacySuppressionVariance } from "./legacy-suppression-variance.js";

/** A rule a legacy suppression variance must pass. Check returns its problems, or none. */
export interface LegacySuppressionVarianceRule {
  check(item: LegacySuppressionVariance): string[];
}

export class LegacySuppressionVarianceRequiredCodeRule implements LegacySuppressionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySuppressionVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySuppressionVarianceTitleLengthRule implements LegacySuppressionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySuppressionVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySuppressionVarianceRequiredSegmentRule implements LegacySuppressionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySuppressionVariance): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy suppression variance. */
export class LegacySuppressionVarianceValidator {
  rules: LegacySuppressionVarianceRule[];

  constructor(rules: LegacySuppressionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySuppressionVariance): string[] {
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

  requireValid(item: LegacySuppressionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySuppressionVariance[]): Map<string, string[]> {
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

export function defaultLegacySuppressionVarianceValidator(): LegacySuppressionVarianceValidator {
  return new LegacySuppressionVarianceValidator(
    [
      new LegacySuppressionVarianceRequiredCodeRule("legacy suppression variance needs a value"),
      new LegacySuppressionVarianceTitleLengthRule(80),
      new LegacySuppressionVarianceRequiredSegmentRule("legacy suppression variance needs a value"),
    ],
  );
}
