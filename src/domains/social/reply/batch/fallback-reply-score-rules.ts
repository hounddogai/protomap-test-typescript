import { FallbackReplyScore } from "./fallback-reply-score.js";

/** A rule a fallback reply score must pass. Check returns its problems, or none. */
export interface FallbackReplyScoreRule {
  check(item: FallbackReplyScore): string[];
}

export class FallbackReplyScoreLocaleLengthRule implements FallbackReplyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReplyScore): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackReplyScoreRequiredCodeRule implements FallbackReplyScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackReplyScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackReplyScoreCodePrefixRule implements FallbackReplyScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackReplyScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackReplyScoreTitleLengthRule implements FallbackReplyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReplyScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback reply score. */
export class FallbackReplyScoreValidator {
  rules: FallbackReplyScoreRule[];

  constructor(rules: FallbackReplyScoreRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReplyScore): string[] {
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

  requireValid(item: FallbackReplyScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReplyScore[]): Map<string, string[]> {
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

export function defaultFallbackReplyScoreValidator(): FallbackReplyScoreValidator {
  return new FallbackReplyScoreValidator(
    [
      new FallbackReplyScoreLocaleLengthRule(120),
      new FallbackReplyScoreRequiredCodeRule("fallback reply score needs an entry"),
      new FallbackReplyScoreCodePrefixRule("X"),
      new FallbackReplyScoreTitleLengthRule(16),
    ],
  );
}
