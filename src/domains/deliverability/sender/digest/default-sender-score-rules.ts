import { DefaultSenderScore } from "./default-sender-score.js";

/** A rule a default sender score must pass. Check returns its problems, or none. */
export interface DefaultSenderScoreRule {
  check(item: DefaultSenderScore): string[];
}

export class DefaultSenderScoreTitleLengthRule implements DefaultSenderScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSenderScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSenderScoreRequiredTitleRule implements DefaultSenderScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSenderScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultSenderScoreStartsAtRangeRule implements DefaultSenderScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSenderScore): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultSenderScoreCodePrefixRule implements DefaultSenderScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultSenderScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default sender score. */
export class DefaultSenderScoreValidator {
  rules: DefaultSenderScoreRule[];

  constructor(rules: DefaultSenderScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSenderScore): string[] {
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

  requireValid(item: DefaultSenderScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSenderScore[]): Map<string, string[]> {
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

export function defaultDefaultSenderScoreValidator(): DefaultSenderScoreValidator {
  return new DefaultSenderScoreValidator(
    [
      new DefaultSenderScoreTitleLengthRule(120),
      new DefaultSenderScoreRequiredTitleRule("default sender score needs an entry"),
      new DefaultSenderScoreStartsAtRangeRule(16, 3600),
      new DefaultSenderScoreCodePrefixRule("ACM"),
    ],
  );
}
