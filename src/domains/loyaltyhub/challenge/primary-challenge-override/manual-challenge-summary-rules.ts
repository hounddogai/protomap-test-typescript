import { ManualChallengeSummary } from "./manual-challenge-summary.js";

/** A rule a manual challenge summary must pass. Check returns its problems, or none. */
export interface ManualChallengeSummaryRule {
  check(item: ManualChallengeSummary): string[];
}

export class ManualChallengeSummaryNameLengthRule implements ManualChallengeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualChallengeSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualChallengeSummaryCohortLengthRule implements ManualChallengeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualChallengeSummary): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualChallengeSummaryRequiredNameRule implements ManualChallengeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualChallengeSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual challenge summary. */
export class ManualChallengeSummaryValidator {
  rules: ManualChallengeSummaryRule[];

  constructor(rules: ManualChallengeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ManualChallengeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualChallengeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualChallengeSummary[]): Map<string, string[]> {
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

export function defaultManualChallengeSummaryValidator(): ManualChallengeSummaryValidator {
  return new ManualChallengeSummaryValidator(
    [
      new ManualChallengeSummaryNameLengthRule(64),
      new ManualChallengeSummaryCohortLengthRule(80),
      new ManualChallengeSummaryRequiredNameRule("manual challenge summary needs a value"),
    ],
  );
}
