import { PostRecord } from "./post-record.js";

/** A rule a post record must pass. Check returns its problems, or none. */
export interface PostRecordRule {
  check(item: PostRecord): string[];
}

export class PostRecordLabelLengthRule implements PostRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostRecordRequiredCodeRule implements PostRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostRecordRequiredLabelRule implements PostRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post record. */
export class PostRecordValidator {
  rules: PostRecordRule[];

  constructor(rules: PostRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PostRecord): string[] {
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

  requireValid(item: PostRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostRecord[]): Map<string, string[]> {
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

export function defaultPostRecordValidator(): PostRecordValidator {
  return new PostRecordValidator(
    [
      new PostRecordLabelLengthRule(64),
      new PostRecordRequiredCodeRule("post record needs an entry"),
      new PostRecordRequiredLabelRule("post record needs this field"),
    ],
  );
}
