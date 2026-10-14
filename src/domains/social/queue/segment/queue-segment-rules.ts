import { QueueSegment } from "./queue-segment.js";

/** A rule a queue segment must pass. Check returns its problems, or none. */
export interface QueueSegmentRule {
  check(item: QueueSegment): string[];
}

export class QueueSegmentRequiredCodeRule implements QueueSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueSegmentCodePrefixRule implements QueueSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class QueueSegmentCodeLengthRule implements QueueSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue segment. */
export class QueueSegmentValidator {
  rules: QueueSegmentRule[];

  constructor(rules: QueueSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: QueueSegment): string[] {
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

  requireValid(item: QueueSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueSegment[]): Map<string, string[]> {
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

export function defaultQueueSegmentValidator(): QueueSegmentValidator {
  return new QueueSegmentValidator(
    [
      new QueueSegmentRequiredCodeRule("queue segment needs an entry"),
      new QueueSegmentCodePrefixRule("REF"),
      new QueueSegmentCodeLengthRule(120),
    ],
  );
}
