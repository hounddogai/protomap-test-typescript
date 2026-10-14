import { QueueSchedule } from "./queue-schedule.js";

/** A rule a queue schedule must pass. Check returns its problems, or none. */
export interface QueueScheduleRule {
  check(item: QueueSchedule): string[];
}

export class QueueScheduleRequiredTitleRule implements QueueScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class QueueScheduleCodeLengthRule implements QueueScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueScheduleRequiredLocaleRule implements QueueScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueSchedule): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class QueueScheduleCodePrefixRule implements QueueScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a queue schedule. */
export class QueueScheduleValidator {
  rules: QueueScheduleRule[];

  constructor(rules: QueueScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: QueueSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueSchedule[]): Map<string, string[]> {
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

export function defaultQueueScheduleValidator(): QueueScheduleValidator {
  return new QueueScheduleValidator(
    [
      new QueueScheduleRequiredTitleRule("queue schedule needs an entry"),
      new QueueScheduleCodeLengthRule(80),
      new QueueScheduleRequiredLocaleRule("queue schedule needs this field"),
      new QueueScheduleCodePrefixRule("ACM"),
    ],
  );
}
