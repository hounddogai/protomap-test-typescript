import { TieredRetentionScore } from "./tiered-retention-score.js";

/** A rule a tiered retention score must pass. Check returns its problems, or none. */
export interface TieredRetentionScoreRule {
  check(item: TieredRetentionScore): string[];
}

export class TieredRetentionScoreCodePrefixRule implements TieredRetentionScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredRetentionScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredRetentionScoreRequiredLocaleRule implements TieredRetentionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRetentionScore): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRetentionScoreLabelLengthRule implements TieredRetentionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRetentionScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRetentionScoreEndsAtRangeRule implements TieredRetentionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRetentionScore): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredRetentionScoreRequiredTitleRule implements TieredRetentionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRetentionScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered retention score. */
export class TieredRetentionScoreValidator {
  rules: TieredRetentionScoreRule[];

  constructor(rules: TieredRetentionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRetentionScore): string[] {
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

  requireValid(item: TieredRetentionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRetentionScore[]): Map<string, string[]> {
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

export function defaultTieredRetentionScoreValidator(): TieredRetentionScoreValidator {
  return new TieredRetentionScoreValidator(
    [
      new TieredRetentionScoreCodePrefixRule("X"),
      new TieredRetentionScoreRequiredLocaleRule("tiered retention score needs an entry"),
      new TieredRetentionScoreLabelLengthRule(80),
      new TieredRetentionScoreEndsAtRangeRule(64, 1000),
      new TieredRetentionScoreRequiredTitleRule("tiered retention score needs a value"),
    ],
  );
}
