import { DefaultInviteSummary } from "./default-invite-summary.js";

/** A rule a default invite summary must pass. Check returns its problems, or none. */
export interface DefaultInviteSummaryRule {
  check(item: DefaultInviteSummary): string[];
}

export class DefaultInviteSummaryCohortLengthRule implements DefaultInviteSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInviteSummary): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultInviteSummaryDescriptionLengthRule implements DefaultInviteSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInviteSummary): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultInviteSummaryScoreRangeRule implements DefaultInviteSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultInviteSummary): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultInviteSummaryRequiredCodeRule implements DefaultInviteSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInviteSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultInviteSummaryRequiredCohortRule implements DefaultInviteSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInviteSummary): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultInviteSummaryNameLengthRule implements DefaultInviteSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInviteSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default invite summary. */
export class DefaultInviteSummaryValidator {
  rules: DefaultInviteSummaryRule[];

  constructor(rules: DefaultInviteSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultInviteSummary): string[] {
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

  requireValid(item: DefaultInviteSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultInviteSummary[]): Map<string, string[]> {
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

export function defaultDefaultInviteSummaryValidator(): DefaultInviteSummaryValidator {
  return new DefaultInviteSummaryValidator(
    [
      new DefaultInviteSummaryCohortLengthRule(64),
      new DefaultInviteSummaryDescriptionLengthRule(1000),
      new DefaultInviteSummaryScoreRangeRule(0.1, 3773.1),
      new DefaultInviteSummaryRequiredCodeRule("default invite summary needs this field"),
      new DefaultInviteSummaryRequiredCohortRule("default invite summary needs this field"),
      new DefaultInviteSummaryNameLengthRule(80),
    ],
  );
}
