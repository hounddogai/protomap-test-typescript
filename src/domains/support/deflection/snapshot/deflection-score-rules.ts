import { DeflectionScore } from "./deflection-score.js";

/** A rule a deflection score must pass. Check returns its problems, or none. */
export interface DeflectionScoreRule {
  check(item: DeflectionScore): string[];
}

export class DeflectionScoreCodeLengthRule implements DeflectionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionScoreChannelLengthRule implements DeflectionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionScore): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionScoreRequiredCodeRule implements DeflectionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionScoreRequiredLabelRule implements DeflectionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionScoreBidRangeRule implements DeflectionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionScore): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionScoreWindowDaysRangeRule implements DeflectionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionScore): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a deflection score. */
export class DeflectionScoreValidator {
  rules: DeflectionScoreRule[];

  constructor(rules: DeflectionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionScore[]): Map<string, string[]> {
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

export function defaultDeflectionScoreValidator(): DeflectionScoreValidator {
  return new DeflectionScoreValidator(
    [
      new DeflectionScoreCodeLengthRule(255),
      new DeflectionScoreChannelLengthRule(16),
      new DeflectionScoreRequiredCodeRule("deflection score needs this field"),
      new DeflectionScoreRequiredLabelRule("deflection score needs an entry"),
      new DeflectionScoreBidRangeRule(6.5, 3275.3),
      new DeflectionScoreWindowDaysRangeRule(32, 3600),
    ],
  );
}
