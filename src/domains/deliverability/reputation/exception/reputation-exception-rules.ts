import { ReputationException } from "./reputation-exception.js";

/** A rule a reputation exception must pass. Check returns its problems, or none. */
export interface ReputationExceptionRule {
  check(item: ReputationException): string[];
}

export class ReputationExceptionMinimumRangeRule implements ReputationExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationException): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReputationExceptionRequiredChecksumRule implements ReputationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationException): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationExceptionSummaryLengthRule implements ReputationExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationException): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationExceptionRequiredSummaryRule implements ReputationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationException): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation exception. */
export class ReputationExceptionValidator {
  rules: ReputationExceptionRule[];

  constructor(rules: ReputationExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationException): string[] {
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

  requireValid(item: ReputationException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationException[]): Map<string, string[]> {
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

export function defaultReputationExceptionValidator(): ReputationExceptionValidator {
  return new ReputationExceptionValidator(
    [
      new ReputationExceptionMinimumRangeRule(5.2, 4421.5),
      new ReputationExceptionRequiredChecksumRule("reputation exception needs a value"),
      new ReputationExceptionSummaryLengthRule(120),
      new ReputationExceptionRequiredSummaryRule("reputation exception needs a value"),
    ],
  );
}
