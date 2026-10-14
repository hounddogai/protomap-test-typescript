import { FrequencySummary } from "./frequency-summary.js";

/** A rule a frequency summary must pass. Check returns its problems, or none. */
export interface FrequencySummaryRule {
  check(item: FrequencySummary): string[];
}

export class FrequencySummaryExternalRefLengthRule implements FrequencySummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencySummary): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencySummaryRequiredNameRule implements FrequencySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencySummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencySummaryRequiredReviewerRule implements FrequencySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencySummary): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency summary. */
export class FrequencySummaryValidator {
  rules: FrequencySummaryRule[];

  constructor(rules: FrequencySummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencySummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencySummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencySummary[]): Map<string, string[]> {
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

export function defaultFrequencySummaryValidator(): FrequencySummaryValidator {
  return new FrequencySummaryValidator(
    [
      new FrequencySummaryExternalRefLengthRule(120),
      new FrequencySummaryRequiredNameRule("frequency summary needs this field"),
      new FrequencySummaryRequiredReviewerRule("frequency summary needs an entry"),
    ],
  );
}
