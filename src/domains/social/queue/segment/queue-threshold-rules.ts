import * as text from "../../../../kit/text.js";
import { QueueThreshold } from "./queue-threshold.js";

/** A rule a queue threshold must pass. Check returns its problems, or none. */
export interface QueueThresholdRule {
  check(item: QueueThreshold): string[];
}

export class QueueThresholdDurationMinutesRangeRule implements QueueThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueThreshold): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueThresholdNameLengthRule implements QueueThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueThresholdRequiredCountryRule implements QueueThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueThreshold): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class QueueThresholdAllowedCodeRule implements QueueThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a queue threshold. */
export class QueueThresholdValidator {
  rules: QueueThresholdRule[];

  constructor(rules: QueueThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: QueueThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueThreshold[]): Map<string, string[]> {
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

export function defaultQueueThresholdValidator(): QueueThresholdValidator {
  return new QueueThresholdValidator(
    [
      new QueueThresholdDurationMinutesRangeRule(120, 86400),
      new QueueThresholdNameLengthRule(16),
      new QueueThresholdRequiredCountryRule("queue threshold needs an entry"),
      new QueueThresholdAllowedCodeRule(["default"]),
    ],
  );
}
