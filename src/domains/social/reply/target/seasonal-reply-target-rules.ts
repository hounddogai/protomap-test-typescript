import { SeasonalReplyTarget } from "./seasonal-reply-target.js";

/** A rule a seasonal reply target must pass. Check returns its problems, or none. */
export interface SeasonalReplyTargetRule {
  check(item: SeasonalReplyTarget): string[];
}

export class SeasonalReplyTargetCapacityRangeRule implements SeasonalReplyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalReplyTarget): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalReplyTargetLabelLengthRule implements SeasonalReplyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReplyTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalReplyTargetAttemptsRangeRule implements SeasonalReplyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalReplyTarget): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal reply target. */
export class SeasonalReplyTargetValidator {
  rules: SeasonalReplyTargetRule[];

  constructor(rules: SeasonalReplyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalReplyTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalReplyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalReplyTarget[]): Map<string, string[]> {
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

export function defaultSeasonalReplyTargetValidator(): SeasonalReplyTargetValidator {
  return new SeasonalReplyTargetValidator(
    [
      new SeasonalReplyTargetCapacityRangeRule(80, 1000),
      new SeasonalReplyTargetLabelLengthRule(64),
      new SeasonalReplyTargetAttemptsRangeRule(32, 3600),
    ],
  );
}
