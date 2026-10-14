import { PendingMentionScore } from "./pending-mention-score.js";

/** A rule a pending mention score must pass. Check returns its problems, or none. */
export interface PendingMentionScoreRule {
  check(item: PendingMentionScore): string[];
}

export class PendingMentionScoreCodePrefixRule implements PendingMentionScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingMentionScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingMentionScoreRequiredCountryRule implements PendingMentionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingMentionScore): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PendingMentionScoreRequiredCodeRule implements PendingMentionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingMentionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingMentionScoreCodeLengthRule implements PendingMentionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingMentionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingMentionScoreTitleLengthRule implements PendingMentionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingMentionScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending mention score. */
export class PendingMentionScoreValidator {
  rules: PendingMentionScoreRule[];

  constructor(rules: PendingMentionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PendingMentionScore): string[] {
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

  requireValid(item: PendingMentionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingMentionScore[]): Map<string, string[]> {
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

export function defaultPendingMentionScoreValidator(): PendingMentionScoreValidator {
  return new PendingMentionScoreValidator(
    [
      new PendingMentionScoreCodePrefixRule("ACM"),
      new PendingMentionScoreRequiredCountryRule("pending mention score needs a value"),
      new PendingMentionScoreRequiredCodeRule("pending mention score needs an entry"),
      new PendingMentionScoreCodeLengthRule(1000),
      new PendingMentionScoreTitleLengthRule(64),
    ],
  );
}
