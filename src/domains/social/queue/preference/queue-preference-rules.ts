import { QueuePreference } from "./queue-preference.js";

/** A rule a queue preference must pass. Check returns its problems, or none. */
export interface QueuePreferenceRule {
  check(item: QueuePreference): string[];
}

export class QueuePreferenceRequiredLabelRule implements QueuePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueuePreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class QueuePreferenceRequiredContactEmailRule implements QueuePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueuePreference): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class QueuePreferenceStartsAtRangeRule implements QueuePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueuePreference): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueuePreferenceContactEmailLengthRule implements QueuePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueuePreference): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueuePreferenceEndsAtRangeRule implements QueuePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueuePreference): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a queue preference. */
export class QueuePreferenceValidator {
  rules: QueuePreferenceRule[];

  constructor(rules: QueuePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: QueuePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueuePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueuePreference[]): Map<string, string[]> {
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

export function defaultQueuePreferenceValidator(): QueuePreferenceValidator {
  return new QueuePreferenceValidator(
    [
      new QueuePreferenceRequiredLabelRule("queue preference needs this field"),
      new QueuePreferenceRequiredContactEmailRule("queue preference needs this field"),
      new QueuePreferenceStartsAtRangeRule(32, 86400),
      new QueuePreferenceContactEmailLengthRule(16),
      new QueuePreferenceEndsAtRangeRule(255, 255),
    ],
  );
}
