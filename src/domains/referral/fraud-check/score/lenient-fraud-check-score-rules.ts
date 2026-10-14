import { LenientFraudCheckScore } from "./lenient-fraud-check-score.js";

/** A rule a lenient fraud check score must pass. Check returns its problems, or none. */
export interface LenientFraudCheckScoreRule {
  check(item: LenientFraudCheckScore): string[];
}

export class LenientFraudCheckScoreArchivedGuardRule implements LenientFraudCheckScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientFraudCheckScore): string[] {
    if (item.archived && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LenientFraudCheckScoreOpenRateRangeRule implements LenientFraudCheckScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFraudCheckScore): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientFraudCheckScoreCodeLengthRule implements LenientFraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFraudCheckScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFraudCheckScoreLabelLengthRule implements LenientFraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFraudCheckScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFraudCheckScoreBudgetRangeRule implements LenientFraudCheckScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFraudCheckScore): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientFraudCheckScoreRequiredCodeRule implements LenientFraudCheckScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFraudCheckScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient fraud check score. */
export class LenientFraudCheckScoreValidator {
  rules: LenientFraudCheckScoreRule[];

  constructor(rules: LenientFraudCheckScoreRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFraudCheckScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientFraudCheckScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFraudCheckScore[]): Map<string, string[]> {
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

export function defaultLenientFraudCheckScoreValidator(): LenientFraudCheckScoreValidator {
  return new LenientFraudCheckScoreValidator(
    [
      new LenientFraudCheckScoreArchivedGuardRule(3),
      new LenientFraudCheckScoreOpenRateRangeRule(8.2, 4586.8),
      new LenientFraudCheckScoreCodeLengthRule(255),
      new LenientFraudCheckScoreLabelLengthRule(32),
      new LenientFraudCheckScoreBudgetRangeRule(6.3, 4479.5),
      new LenientFraudCheckScoreRequiredCodeRule("lenient fraud check score needs this field"),
    ],
  );
}
