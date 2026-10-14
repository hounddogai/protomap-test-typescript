import { ScheduledDomainScore } from "./scheduled-domain-score.js";

/** A rule a scheduled domain score must pass. Check returns its problems, or none. */
export interface ScheduledDomainScoreRule {
  check(item: ScheduledDomainScore): string[];
}

export class ScheduledDomainScoreOwnerIdLengthRule implements ScheduledDomainScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainScore): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDomainScoreMarginRangeRule implements ScheduledDomainScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDomainScore): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledDomainScoreRequiredOwnerIdRule implements ScheduledDomainScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDomainScore): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDomainScoreCostRangeRule implements ScheduledDomainScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDomainScore): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledDomainScoreLabelLengthRule implements ScheduledDomainScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled domain score. */
export class ScheduledDomainScoreValidator {
  rules: ScheduledDomainScoreRule[];

  constructor(rules: ScheduledDomainScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDomainScore): string[] {
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

  requireValid(item: ScheduledDomainScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDomainScore[]): Map<string, string[]> {
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

export function defaultScheduledDomainScoreValidator(): ScheduledDomainScoreValidator {
  return new ScheduledDomainScoreValidator(
    [
      new ScheduledDomainScoreOwnerIdLengthRule(80),
      new ScheduledDomainScoreMarginRangeRule(4.7, 1556),
      new ScheduledDomainScoreRequiredOwnerIdRule("scheduled domain score needs this field"),
      new ScheduledDomainScoreCostRangeRule(5.8, 2020.9),
      new ScheduledDomainScoreLabelLengthRule(64),
    ],
  );
}
