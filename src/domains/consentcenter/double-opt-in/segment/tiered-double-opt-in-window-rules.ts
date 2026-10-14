import { TieredDoubleOptInWindow } from "./tiered-double-opt-in-window.js";

/** A rule a tiered double opt in window must pass. Check returns its problems, or none. */
export interface TieredDoubleOptInWindowRule {
  check(item: TieredDoubleOptInWindow): string[];
}

export class TieredDoubleOptInWindowChannelLengthRule implements TieredDoubleOptInWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInWindow): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDoubleOptInWindowRequiredNameRule implements TieredDoubleOptInWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDoubleOptInWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDoubleOptInWindowBudgetRangeRule implements TieredDoubleOptInWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDoubleOptInWindow): string[] {
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

export class TieredDoubleOptInWindowScoreRangeRule implements TieredDoubleOptInWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDoubleOptInWindow): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredDoubleOptInWindowCodeLengthRule implements TieredDoubleOptInWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDoubleOptInWindowRequiredDescriptionRule implements TieredDoubleOptInWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDoubleOptInWindow): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered double opt in window. */
export class TieredDoubleOptInWindowValidator {
  rules: TieredDoubleOptInWindowRule[];

  constructor(rules: TieredDoubleOptInWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDoubleOptInWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredDoubleOptInWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDoubleOptInWindow[]): Map<string, string[]> {
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

export function defaultTieredDoubleOptInWindowValidator(): TieredDoubleOptInWindowValidator {
  return new TieredDoubleOptInWindowValidator(
    [
      new TieredDoubleOptInWindowChannelLengthRule(64),
      new TieredDoubleOptInWindowRequiredNameRule("tiered double opt in window needs a value"),
      new TieredDoubleOptInWindowBudgetRangeRule(7.7, 2164.5),
      new TieredDoubleOptInWindowScoreRangeRule(1.8, 1561.3),
      new TieredDoubleOptInWindowCodeLengthRule(64),
      new TieredDoubleOptInWindowRequiredDescriptionRule("tiered double opt in window needs an entry"),
    ],
  );
}
