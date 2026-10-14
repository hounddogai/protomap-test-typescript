import { QueueRequest } from "./queue-request.js";

/** A rule a queue request must pass. Check returns its problems, or none. */
export interface QueueRequestRule {
  check(item: QueueRequest): string[];
}

export class QueueRequestDurationMinutesRangeRule implements QueueRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueRequest): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueRequestRequiredVariantRule implements QueueRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueRequest): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class QueueRequestVariantLengthRule implements QueueRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueRequest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueRequestNotesLengthRule implements QueueRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueRequest): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueRequestRequiredNotesRule implements QueueRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueRequest): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue request. */
export class QueueRequestValidator {
  rules: QueueRequestRule[];

  constructor(rules: QueueRequestRule[]) {
    this.rules = rules;
  }

  validate(item: QueueRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueRequest[]): Map<string, string[]> {
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

export function defaultQueueRequestValidator(): QueueRequestValidator {
  return new QueueRequestValidator(
    [
      new QueueRequestDurationMinutesRangeRule(32, 32),
      new QueueRequestRequiredVariantRule("queue request needs a value"),
      new QueueRequestVariantLengthRule(255),
      new QueueRequestNotesLengthRule(80),
      new QueueRequestRequiredNotesRule("queue request needs an entry"),
    ],
  );
}
