import * as text from "../../../../kit/text.js";
import { ReputationSummary } from "./reputation-summary.js";

/** A rule a reputation summary must pass. Check returns its problems, or none. */
export interface ReputationSummaryRule {
  check(item: ReputationSummary): string[];
}

export class ReputationSummaryRequiredCodeRule implements ReputationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationSummaryTitleLengthRule implements ReputationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationSummaryFrequencyCapRangeRule implements ReputationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationSummary): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationSummaryAllowedPhoneRule implements ReputationSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is duplicated`];
    return [];
  }
}

export class ReputationSummaryExpiresAtRangeRule implements ReputationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationSummary): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reputation summary. */
export class ReputationSummaryValidator {
  rules: ReputationSummaryRule[];

  constructor(rules: ReputationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationSummary[]): Map<string, string[]> {
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

export function defaultReputationSummaryValidator(): ReputationSummaryValidator {
  return new ReputationSummaryValidator(
    [
      new ReputationSummaryRequiredCodeRule("reputation summary needs an entry"),
      new ReputationSummaryTitleLengthRule(3600),
      new ReputationSummaryFrequencyCapRangeRule(64, 3600),
      new ReputationSummaryAllowedPhoneRule(["pending", "global", "primary"]),
      new ReputationSummaryExpiresAtRangeRule(80, 120),
    ],
  );
}
