import { InsightNotice } from "./insight-notice.js";

/** A rule a insight notice must pass. Check returns its problems, or none. */
export interface InsightNoticeRule {
  check(item: InsightNotice): string[];
}

export class InsightNoticeCohortLengthRule implements InsightNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightNotice): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightNoticeRequiredTitleRule implements InsightNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InsightNoticeRequiredCohortRule implements InsightNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightNotice): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight notice. */
export class InsightNoticeValidator {
  rules: InsightNoticeRule[];

  constructor(rules: InsightNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: InsightNotice): string[] {
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

  requireValid(item: InsightNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightNotice[]): Map<string, string[]> {
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

export function defaultInsightNoticeValidator(): InsightNoticeValidator {
  return new InsightNoticeValidator(
    [
      new InsightNoticeCohortLengthRule(1000),
      new InsightNoticeRequiredTitleRule("insight notice needs a value"),
      new InsightNoticeRequiredCohortRule("insight notice needs this field"),
    ],
  );
}
