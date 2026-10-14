import { DefaultInviteScore } from "./default-invite-score.js";

/** A rule a default invite score must pass. Check returns its problems, or none. */
export interface DefaultInviteScoreRule {
  check(item: DefaultInviteScore): string[];
}

export class DefaultInviteScoreCodePrefixRule implements DefaultInviteScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultInviteScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultInviteScoreTitleLengthRule implements DefaultInviteScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInviteScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultInviteScoreRequiredTitleRule implements DefaultInviteScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInviteScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultInviteScoreActiveGuardRule implements DefaultInviteScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultInviteScore): string[] {
    if (item.active && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class DefaultInviteScoreRequiredContactEmailRule implements DefaultInviteScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInviteScore): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default invite score. */
export class DefaultInviteScoreValidator {
  rules: DefaultInviteScoreRule[];

  constructor(rules: DefaultInviteScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultInviteScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultInviteScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultInviteScore[]): Map<string, string[]> {
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

export function defaultDefaultInviteScoreValidator(): DefaultInviteScoreValidator {
  return new DefaultInviteScoreValidator(
    [
      new DefaultInviteScoreCodePrefixRule("Q"),
      new DefaultInviteScoreTitleLengthRule(16),
      new DefaultInviteScoreRequiredTitleRule("default invite score needs an entry"),
      new DefaultInviteScoreActiveGuardRule(8.3),
      new DefaultInviteScoreRequiredContactEmailRule("default invite score needs a value"),
    ],
  );
}
