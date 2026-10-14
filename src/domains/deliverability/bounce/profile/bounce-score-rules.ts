import { BounceScore } from "./bounce-score.js";

/** A rule a bounce score must pass. Check returns its problems, or none. */
export interface BounceScoreRule {
  check(item: BounceScore): string[];
}

export class BounceScoreVisibleGuardRule implements BounceScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BounceScore): string[] {
    if (item.visible && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class BounceScoreCodePrefixRule implements BounceScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BounceScoreTitleLengthRule implements BounceScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceScoreRequiredTitleRule implements BounceScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BounceScoreRequiredLocaleRule implements BounceScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceScore): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BounceScoreAmountRangeRule implements BounceScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceScore): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a bounce score. */
export class BounceScoreValidator {
  rules: BounceScoreRule[];

  constructor(rules: BounceScoreRule[]) {
    this.rules = rules;
  }

  validate(item: BounceScore): string[] {
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

  requireValid(item: BounceScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceScore[]): Map<string, string[]> {
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

export function defaultBounceScoreValidator(): BounceScoreValidator {
  return new BounceScoreValidator(
    [
      new BounceScoreVisibleGuardRule(1000),
      new BounceScoreCodePrefixRule("OPS"),
      new BounceScoreTitleLengthRule(32),
      new BounceScoreRequiredTitleRule("bounce score needs a value"),
      new BounceScoreRequiredLocaleRule("bounce score needs an entry"),
      new BounceScoreAmountRangeRule(8.4, 4937.1),
    ],
  );
}
