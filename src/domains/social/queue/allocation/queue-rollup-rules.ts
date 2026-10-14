import { QueueRollup } from "./queue-rollup.js";

/** A rule a queue rollup must pass. Check returns its problems, or none. */
export interface QueueRollupRule {
  check(item: QueueRollup): string[];
}

export class QueueRollupLabelLengthRule implements QueueRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueRollupNotesLengthRule implements QueueRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueRollup): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueRollupRequiredLabelRule implements QueueRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class QueueRollupCodePrefixRule implements QueueRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class QueueRollupPhoneLengthRule implements QueueRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueRollup): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue rollup. */
export class QueueRollupValidator {
  rules: QueueRollupRule[];

  constructor(rules: QueueRollupRule[]) {
    this.rules = rules;
  }

  validate(item: QueueRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueRollup[]): Map<string, string[]> {
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

export function defaultQueueRollupValidator(): QueueRollupValidator {
  return new QueueRollupValidator(
    [
      new QueueRollupLabelLengthRule(86400),
      new QueueRollupNotesLengthRule(32),
      new QueueRollupRequiredLabelRule("queue rollup needs an entry"),
      new QueueRollupCodePrefixRule("REF"),
      new QueueRollupPhoneLengthRule(1000),
    ],
  );
}
