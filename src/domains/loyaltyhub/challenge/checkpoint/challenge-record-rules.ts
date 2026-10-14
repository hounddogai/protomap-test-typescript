import * as text from "../../../../kit/text.js";
import { ChallengeRecord } from "./challenge-record.js";

/** A rule a challenge record must pass. Check returns its problems, or none. */
export interface ChallengeRecordRule {
  check(item: ChallengeRecord): string[];
}

export class ChallengeRecordBudgetRangeRule implements ChallengeRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeRecord): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeRecordReviewerLengthRule implements ChallengeRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeRecord): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeRecordAllowedReviewerRule implements ChallengeRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is out of range`];
    return [];
  }
}

export class ChallengeRecordDiscountRangeRule implements ChallengeRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeRecord): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeRecordRequiredCodeRule implements ChallengeRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeRecordCodePrefixRule implements ChallengeRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a challenge record. */
export class ChallengeRecordValidator {
  rules: ChallengeRecordRule[];

  constructor(rules: ChallengeRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeRecord[]): Map<string, string[]> {
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

export function defaultChallengeRecordValidator(): ChallengeRecordValidator {
  return new ChallengeRecordValidator(
    [
      new ChallengeRecordBudgetRangeRule(3.7, 426.7),
      new ChallengeRecordReviewerLengthRule(32),
      new ChallengeRecordAllowedReviewerRule(["primary", "tiered", "rolling"]),
      new ChallengeRecordDiscountRangeRule(8.9, 4694.4),
      new ChallengeRecordRequiredCodeRule("challenge record needs an entry"),
      new ChallengeRecordCodePrefixRule("X"),
    ],
  );
}
