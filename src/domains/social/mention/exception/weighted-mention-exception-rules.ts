import { WeightedMentionException } from "./weighted-mention-exception.js";

/** A rule a weighted mention exception must pass. Check returns its problems, or none. */
export interface WeightedMentionExceptionRule {
  check(item: WeightedMentionException): string[];
}

export class WeightedMentionExceptionRequiredLabelRule implements WeightedMentionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMentionExceptionRequiredTitleRule implements WeightedMentionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMentionExceptionConversionRateRangeRule implements WeightedMentionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedMentionException): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedMentionExceptionLabelLengthRule implements WeightedMentionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedMentionException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted mention exception. */
export class WeightedMentionExceptionValidator {
  rules: WeightedMentionExceptionRule[];

  constructor(rules: WeightedMentionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedMentionException): string[] {
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

  requireValid(item: WeightedMentionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedMentionException[]): Map<string, string[]> {
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

export function defaultWeightedMentionExceptionValidator(): WeightedMentionExceptionValidator {
  return new WeightedMentionExceptionValidator(
    [
      new WeightedMentionExceptionRequiredLabelRule("weighted mention exception needs an entry"),
      new WeightedMentionExceptionRequiredTitleRule("weighted mention exception needs an entry"),
      new WeightedMentionExceptionConversionRateRangeRule(2.4, 3510.2),
      new WeightedMentionExceptionLabelLengthRule(16),
    ],
  );
}
