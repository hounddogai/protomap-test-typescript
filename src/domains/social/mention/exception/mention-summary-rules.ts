import * as text from "../../../../kit/text.js";
import { MentionSummary } from "./mention-summary.js";

/** A rule a mention summary must pass. Check returns its problems, or none. */
export interface MentionSummaryRule {
  check(item: MentionSummary): string[];
}

export class MentionSummaryTitleLengthRule implements MentionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionSummaryRequiredTitleRule implements MentionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class MentionSummaryCodeLengthRule implements MentionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionSummaryCapacityRangeRule implements MentionSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionSummary): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionSummaryAllowedDescriptionRule implements MentionSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is not allowed`];
    return [];
  }
}

export class MentionSummaryGraceDaysRangeRule implements MentionSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionSummary): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a mention summary. */
export class MentionSummaryValidator {
  rules: MentionSummaryRule[];

  constructor(rules: MentionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: MentionSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionSummary[]): Map<string, string[]> {
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

export function defaultMentionSummaryValidator(): MentionSummaryValidator {
  return new MentionSummaryValidator(
    [
      new MentionSummaryTitleLengthRule(16),
      new MentionSummaryRequiredTitleRule("mention summary needs a value"),
      new MentionSummaryCodeLengthRule(86400),
      new MentionSummaryCapacityRangeRule(1000, 3600),
      new MentionSummaryAllowedDescriptionRule(["default", "strict"]),
      new MentionSummaryGraceDaysRangeRule(80, 1000),
    ],
  );
}
