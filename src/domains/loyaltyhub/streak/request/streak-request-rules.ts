import { StreakRequest } from "./streak-request.js";

/** A rule a streak request must pass. Check returns its problems, or none. */
export interface StreakRequestRule {
  check(item: StreakRequest): string[];
}

export class StreakRequestRequiredLabelRule implements StreakRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StreakRequestSummaryLengthRule implements StreakRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakRequest): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakRequestRequiredSummaryRule implements StreakRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakRequest): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class StreakRequestCodeLengthRule implements StreakRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakRequestSendAtRangeRule implements StreakRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakRequest): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a streak request. */
export class StreakRequestValidator {
  rules: StreakRequestRule[];

  constructor(rules: StreakRequestRule[]) {
    this.rules = rules;
  }

  validate(item: StreakRequest): string[] {
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

  requireValid(item: StreakRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakRequest[]): Map<string, string[]> {
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

export function defaultStreakRequestValidator(): StreakRequestValidator {
  return new StreakRequestValidator(
    [
      new StreakRequestRequiredLabelRule("streak request needs an entry"),
      new StreakRequestSummaryLengthRule(1000),
      new StreakRequestRequiredSummaryRule("streak request needs this field"),
      new StreakRequestCodeLengthRule(16),
      new StreakRequestSendAtRangeRule(80, 120),
    ],
  );
}
