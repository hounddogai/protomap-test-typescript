import { ReplySnapshot } from "./reply-snapshot.js";

/** A rule a reply snapshot must pass. Check returns its problems, or none. */
export interface ReplySnapshotRule {
  check(item: ReplySnapshot): string[];
}

export class ReplySnapshotRequiredTitleRule implements ReplySnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplySnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ReplySnapshotRequiredCodeRule implements ReplySnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplySnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplySnapshotCodePrefixRule implements ReplySnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplySnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplySnapshotDurationMinutesRangeRule implements ReplySnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplySnapshot): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reply snapshot. */
export class ReplySnapshotValidator {
  rules: ReplySnapshotRule[];

  constructor(rules: ReplySnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ReplySnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplySnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplySnapshot[]): Map<string, string[]> {
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

export function defaultReplySnapshotValidator(): ReplySnapshotValidator {
  return new ReplySnapshotValidator(
    [
      new ReplySnapshotRequiredTitleRule("reply snapshot needs this field"),
      new ReplySnapshotRequiredCodeRule("reply snapshot needs an entry"),
      new ReplySnapshotCodePrefixRule("ACM"),
      new ReplySnapshotDurationMinutesRangeRule(64, 120),
    ],
  );
}
