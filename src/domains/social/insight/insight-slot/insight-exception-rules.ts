import { InsightException } from "./insight-exception.js";

/** A rule a insight exception must pass. Check returns its problems, or none. */
export interface InsightExceptionRule {
  check(item: InsightException): string[];
}

export class InsightExceptionScoreRangeRule implements InsightExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightException): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightExceptionRequiredCodeRule implements InsightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightExceptionRequiredChannelRule implements InsightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightException): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight exception. */
export class InsightExceptionValidator {
  rules: InsightExceptionRule[];

  constructor(rules: InsightExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: InsightException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightException[]): Map<string, string[]> {
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

export function defaultInsightExceptionValidator(): InsightExceptionValidator {
  return new InsightExceptionValidator(
    [
      new InsightExceptionScoreRangeRule(1.9, 2762.3),
      new InsightExceptionRequiredCodeRule("insight exception needs a value"),
      new InsightExceptionRequiredChannelRule("insight exception needs this field"),
    ],
  );
}
