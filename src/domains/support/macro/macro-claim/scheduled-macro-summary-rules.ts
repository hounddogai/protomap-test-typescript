import { ScheduledMacroSummary } from "./scheduled-macro-summary.js";

/** A rule a scheduled macro summary must pass. Check returns its problems, or none. */
export interface ScheduledMacroSummaryRule {
  check(item: ScheduledMacroSummary): string[];
}

export class ScheduledMacroSummaryRequiredSegmentRule implements ScheduledMacroSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMacroSummary): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMacroSummaryRequiredTitleRule implements ScheduledMacroSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMacroSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMacroSummaryTitleLengthRule implements ScheduledMacroSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMacroSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMacroSummaryCohortLengthRule implements ScheduledMacroSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMacroSummary): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled macro summary. */
export class ScheduledMacroSummaryValidator {
  rules: ScheduledMacroSummaryRule[];

  constructor(rules: ScheduledMacroSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledMacroSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledMacroSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledMacroSummary[]): Map<string, string[]> {
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

export function defaultScheduledMacroSummaryValidator(): ScheduledMacroSummaryValidator {
  return new ScheduledMacroSummaryValidator(
    [
      new ScheduledMacroSummaryRequiredSegmentRule("scheduled macro summary needs a value"),
      new ScheduledMacroSummaryRequiredTitleRule("scheduled macro summary needs an entry"),
      new ScheduledMacroSummaryTitleLengthRule(255),
      new ScheduledMacroSummaryCohortLengthRule(32),
    ],
  );
}
