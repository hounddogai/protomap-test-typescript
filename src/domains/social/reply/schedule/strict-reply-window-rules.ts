import * as text from "../../../../kit/text.js";
import { StrictReplyWindow } from "./strict-reply-window.js";

/** A rule a strict reply window must pass. Check returns its problems, or none. */
export interface StrictReplyWindowRule {
  check(item: StrictReplyWindow): string[];
}

export class StrictReplyWindowAllowedCurrencyRule implements StrictReplyWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictReplyWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is stale`];
    return [];
  }
}

export class StrictReplyWindowLabelLengthRule implements StrictReplyWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReplyWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictReplyWindowMaximumRangeRule implements StrictReplyWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReplyWindow): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictReplyWindowRequiredLabelRule implements StrictReplyWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReplyWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReplyWindowCurrencyLengthRule implements StrictReplyWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReplyWindow): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictReplyWindowScoreRangeRule implements StrictReplyWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReplyWindow): string[] {
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

/** Runs every rule of a strict reply window. */
export class StrictReplyWindowValidator {
  rules: StrictReplyWindowRule[];

  constructor(rules: StrictReplyWindowRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReplyWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictReplyWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReplyWindow[]): Map<string, string[]> {
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

export function defaultStrictReplyWindowValidator(): StrictReplyWindowValidator {
  return new StrictReplyWindowValidator(
    [
      new StrictReplyWindowAllowedCurrencyRule(["weighted"]),
      new StrictReplyWindowLabelLengthRule(255),
      new StrictReplyWindowMaximumRangeRule(1.8, 649.6),
      new StrictReplyWindowRequiredLabelRule("strict reply window needs this field"),
      new StrictReplyWindowCurrencyLengthRule(32),
      new StrictReplyWindowScoreRangeRule(9.6, 480),
    ],
  );
}
