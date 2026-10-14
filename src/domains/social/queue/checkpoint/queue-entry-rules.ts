import { QueueEntry } from "./queue-entry.js";

/** A rule a queue entry must pass. Check returns its problems, or none. */
export interface QueueEntryRule {
  check(item: QueueEntry): string[];
}

export class QueueEntryNameLengthRule implements QueueEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueEntryCodePrefixRule implements QueueEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class QueueEntryAudienceIdLengthRule implements QueueEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueEntry): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue entry. */
export class QueueEntryValidator {
  rules: QueueEntryRule[];

  constructor(rules: QueueEntryRule[]) {
    this.rules = rules;
  }

  validate(item: QueueEntry): string[] {
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

  requireValid(item: QueueEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueEntry[]): Map<string, string[]> {
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

export function defaultQueueEntryValidator(): QueueEntryValidator {
  return new QueueEntryValidator(
    [
      new QueueEntryNameLengthRule(3600),
      new QueueEntryCodePrefixRule("X"),
      new QueueEntryAudienceIdLengthRule(32),
    ],
  );
}
