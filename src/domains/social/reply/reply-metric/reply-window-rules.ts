import { ReplyWindow } from "./reply-window.js";

/** A rule a reply window must pass. Check returns its problems, or none. */
export interface ReplyWindowRule {
  check(item: ReplyWindow): string[];
}

export class ReplyWindowRequiredTitleRule implements ReplyWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyWindowCodeLengthRule implements ReplyWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyWindowRequiredCodeRule implements ReplyWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyWindowApprovedGuardRule implements ReplyWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReplyWindow): string[] {
    if (item.approved && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a reply window. */
export class ReplyWindowValidator {
  rules: ReplyWindowRule[];

  constructor(rules: ReplyWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyWindow): string[] {
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

  requireValid(item: ReplyWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyWindow[]): Map<string, string[]> {
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

export function defaultReplyWindowValidator(): ReplyWindowValidator {
  return new ReplyWindowValidator(
    [
      new ReplyWindowRequiredTitleRule("reply window needs this field"),
      new ReplyWindowCodeLengthRule(3600),
      new ReplyWindowRequiredCodeRule("reply window needs a value"),
      new ReplyWindowApprovedGuardRule(120),
    ],
  );
}
