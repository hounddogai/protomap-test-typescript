import { QueueWindow } from "./queue-window.js";

/** A rule a queue window must pass. Check returns its problems, or none. */
export interface QueueWindowRule {
  check(item: QueueWindow): string[];
}

export class QueueWindowRevisionRangeRule implements QueueWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueWindow): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueWindowRequiredUtmSourceRule implements QueueWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueWindow): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class QueueWindowRequiredPhoneRule implements QueueWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueWindow): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class QueueWindowRequiredTitleRule implements QueueWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class QueueWindowRequiredCodeRule implements QueueWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue window. */
export class QueueWindowValidator {
  rules: QueueWindowRule[];

  constructor(rules: QueueWindowRule[]) {
    this.rules = rules;
  }

  validate(item: QueueWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueWindow[]): Map<string, string[]> {
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

export function defaultQueueWindowValidator(): QueueWindowValidator {
  return new QueueWindowValidator(
    [
      new QueueWindowRevisionRangeRule(255, 3600),
      new QueueWindowRequiredUtmSourceRule("queue window needs a value"),
      new QueueWindowRequiredPhoneRule("queue window needs an entry"),
      new QueueWindowRequiredTitleRule("queue window needs this field"),
      new QueueWindowRequiredCodeRule("queue window needs an entry"),
    ],
  );
}
