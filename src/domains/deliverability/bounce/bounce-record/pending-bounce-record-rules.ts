import { PendingBounceRecord } from "./pending-bounce-record.js";

/** A rule a pending bounce record must pass. Check returns its problems, or none. */
export interface PendingBounceRecordRule {
  check(item: PendingBounceRecord): string[];
}

export class PendingBounceRecordRequiredTitleRule implements PendingBounceRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBounceRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBounceRecordChannelLengthRule implements PendingBounceRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBounceRecord): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBounceRecordCodePrefixRule implements PendingBounceRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingBounceRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending bounce record. */
export class PendingBounceRecordValidator {
  rules: PendingBounceRecordRule[];

  constructor(rules: PendingBounceRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBounceRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBounceRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBounceRecord[]): Map<string, string[]> {
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

export function defaultPendingBounceRecordValidator(): PendingBounceRecordValidator {
  return new PendingBounceRecordValidator(
    [
      new PendingBounceRecordRequiredTitleRule("pending bounce record needs this field"),
      new PendingBounceRecordChannelLengthRule(86400),
      new PendingBounceRecordCodePrefixRule("X"),
    ],
  );
}
