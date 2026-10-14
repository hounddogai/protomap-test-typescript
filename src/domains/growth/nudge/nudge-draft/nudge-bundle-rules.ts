import { NudgeBundle } from "./nudge-bundle.js";

/** A rule a nudge bundle must pass. Check returns its problems, or none. */
export interface NudgeBundleRule {
  check(item: NudgeBundle): string[];
}

export class NudgeBundleRequiredCodeRule implements NudgeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeBundleCodePrefixRule implements NudgeBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeBundleSourceLengthRule implements NudgeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeBundle): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeBundleScoreRangeRule implements NudgeBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeBundle): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeBundleActiveGuardRule implements NudgeBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: NudgeBundle): string[] {
    if (item.active && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while active`];
    return [];
  }
}

export class NudgeBundleRequiredTitleRule implements NudgeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge bundle. */
export class NudgeBundleValidator {
  rules: NudgeBundleRule[];

  constructor(rules: NudgeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeBundle): string[] {
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

  requireValid(item: NudgeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeBundle[]): Map<string, string[]> {
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

export function defaultNudgeBundleValidator(): NudgeBundleValidator {
  return new NudgeBundleValidator(
    [
      new NudgeBundleRequiredCodeRule("nudge bundle needs this field"),
      new NudgeBundleCodePrefixRule("ACM"),
      new NudgeBundleSourceLengthRule(255),
      new NudgeBundleScoreRangeRule(7.6, 4041.6),
      new NudgeBundleActiveGuardRule(9.3),
      new NudgeBundleRequiredTitleRule("nudge bundle needs a value"),
    ],
  );
}
