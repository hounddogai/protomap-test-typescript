import { LenientRewardSummary } from "./lenient-reward-summary.js";

/** A rule a lenient reward summary must pass. Check returns its problems, or none. */
export interface LenientRewardSummaryRule {
  check(item: LenientRewardSummary): string[];
}

export class LenientRewardSummaryContactEmailLengthRule implements LenientRewardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardSummary): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardSummaryCodeLengthRule implements LenientRewardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardSummaryNameLengthRule implements LenientRewardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient reward summary. */
export class LenientRewardSummaryValidator {
  rules: LenientRewardSummaryRule[];

  constructor(rules: LenientRewardSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientRewardSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardSummary[]): Map<string, string[]> {
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

export function defaultLenientRewardSummaryValidator(): LenientRewardSummaryValidator {
  return new LenientRewardSummaryValidator(
    [
      new LenientRewardSummaryContactEmailLengthRule(32),
      new LenientRewardSummaryCodeLengthRule(120),
      new LenientRewardSummaryNameLengthRule(16),
    ],
  );
}
