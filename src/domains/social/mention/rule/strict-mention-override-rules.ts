import { StrictMentionOverride } from "./strict-mention-override.js";

/** A rule a strict mention override must pass. Check returns its problems, or none. */
export interface StrictMentionOverrideRule {
  check(item: StrictMentionOverride): string[];
}

export class StrictMentionOverrideRequiredCurrencyRule implements StrictMentionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictMentionOverride): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class StrictMentionOverrideRequiredReviewerRule implements StrictMentionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictMentionOverride): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class StrictMentionOverrideMinimumRangeRule implements StrictMentionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMentionOverride): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictMentionOverrideLimitRangeRule implements StrictMentionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMentionOverride): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictMentionOverrideCodeLengthRule implements StrictMentionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictMentionOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict mention override. */
export class StrictMentionOverrideValidator {
  rules: StrictMentionOverrideRule[];

  constructor(rules: StrictMentionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: StrictMentionOverride): string[] {
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

  requireValid(item: StrictMentionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictMentionOverride[]): Map<string, string[]> {
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

export function defaultStrictMentionOverrideValidator(): StrictMentionOverrideValidator {
  return new StrictMentionOverrideValidator(
    [
      new StrictMentionOverrideRequiredCurrencyRule("strict mention override needs this field"),
      new StrictMentionOverrideRequiredReviewerRule("strict mention override needs this field"),
      new StrictMentionOverrideMinimumRangeRule(3.8, 2558.7),
      new StrictMentionOverrideLimitRangeRule(1000, 3600),
      new StrictMentionOverrideCodeLengthRule(64),
    ],
  );
}
