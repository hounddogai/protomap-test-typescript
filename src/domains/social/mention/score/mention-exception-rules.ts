import { MentionException } from "./mention-exception.js";

/** A rule a mention exception must pass. Check returns its problems, or none. */
export interface MentionExceptionRule {
  check(item: MentionException): string[];
}

export class MentionExceptionImpressionsRangeRule implements MentionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionException): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionExceptionBudgetRangeRule implements MentionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionException): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionExceptionRequiredTitleRule implements MentionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention exception. */
export class MentionExceptionValidator {
  rules: MentionExceptionRule[];

  constructor(rules: MentionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: MentionException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionException[]): Map<string, string[]> {
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

export function defaultMentionExceptionValidator(): MentionExceptionValidator {
  return new MentionExceptionValidator(
    [
      new MentionExceptionImpressionsRangeRule(16, 64),
      new MentionExceptionBudgetRangeRule(1, 1465.6),
      new MentionExceptionRequiredTitleRule("mention exception needs a value"),
    ],
  );
}
