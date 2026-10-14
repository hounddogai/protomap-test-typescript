import * as text from "../../../../kit/text.js";
import { MentionEstimate } from "./mention-estimate.js";

/** A rule a mention estimate must pass. Check returns its problems, or none. */
export interface MentionEstimateRule {
  check(item: MentionEstimate): string[];
}

export class MentionEstimateRequiredTitleRule implements MentionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class MentionEstimateRequiredPhoneRule implements MentionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionEstimate): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class MentionEstimateCeilingRangeRule implements MentionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionEstimate): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionEstimateCohortLengthRule implements MentionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionEstimate): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionEstimateAllowedCohortRule implements MentionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is expired`];
    return [];
  }
}

export class MentionEstimatePhoneLengthRule implements MentionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionEstimate): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention estimate. */
export class MentionEstimateValidator {
  rules: MentionEstimateRule[];

  constructor(rules: MentionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: MentionEstimate): string[] {
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

  requireValid(item: MentionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionEstimate[]): Map<string, string[]> {
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

export function defaultMentionEstimateValidator(): MentionEstimateValidator {
  return new MentionEstimateValidator(
    [
      new MentionEstimateRequiredTitleRule("mention estimate needs an entry"),
      new MentionEstimateRequiredPhoneRule("mention estimate needs this field"),
      new MentionEstimateCeilingRangeRule(8.6, 3711.1),
      new MentionEstimateCohortLengthRule(1000),
      new MentionEstimateAllowedCohortRule(["rolling"]),
      new MentionEstimatePhoneLengthRule(120),
    ],
  );
}
