import { StreakScore } from "./streak-score.js";

/** A rule a streak score must pass. Check returns its problems, or none. */
export interface StreakScoreRule {
  check(item: StreakScore): string[];
}

export class StreakScoreCodePrefixRule implements StreakScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakScoreTitleLengthRule implements StreakScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakScoreRequiredTitleRule implements StreakScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak score. */
export class StreakScoreValidator {
  rules: StreakScoreRule[];

  constructor(rules: StreakScoreRule[]) {
    this.rules = rules;
  }

  validate(item: StreakScore): string[] {
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

  requireValid(item: StreakScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakScore[]): Map<string, string[]> {
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

export function defaultStreakScoreValidator(): StreakScoreValidator {
  return new StreakScoreValidator(
    [
      new StreakScoreCodePrefixRule("REF"),
      new StreakScoreTitleLengthRule(80),
      new StreakScoreRequiredTitleRule("streak score needs a value"),
    ],
  );
}
