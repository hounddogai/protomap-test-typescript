import { LenientQueueEntry } from "./lenient-queue-entry.js";

/** A rule a lenient queue entry must pass. Check returns its problems, or none. */
export interface LenientQueueEntryRule {
  check(item: LenientQueueEntry): string[];
}

export class LenientQueueEntryCeilingRangeRule implements LenientQueueEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientQueueEntry): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientQueueEntryCodeLengthRule implements LenientQueueEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientQueueEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientQueueEntryNameLengthRule implements LenientQueueEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientQueueEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient queue entry. */
export class LenientQueueEntryValidator {
  rules: LenientQueueEntryRule[];

  constructor(rules: LenientQueueEntryRule[]) {
    this.rules = rules;
  }

  validate(item: LenientQueueEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientQueueEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientQueueEntry[]): Map<string, string[]> {
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

export function defaultLenientQueueEntryValidator(): LenientQueueEntryValidator {
  return new LenientQueueEntryValidator(
    [
      new LenientQueueEntryCeilingRangeRule(6.2, 1427.6),
      new LenientQueueEntryCodeLengthRule(64),
      new LenientQueueEntryNameLengthRule(1000),
    ],
  );
}
