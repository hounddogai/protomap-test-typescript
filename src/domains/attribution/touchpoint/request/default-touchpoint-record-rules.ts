import * as text from "../../../../kit/text.js";
import { DefaultTouchpointRecord } from "./default-touchpoint-record.js";

/** A rule a default touchpoint record must pass. Check returns its problems, or none. */
export interface DefaultTouchpointRecordRule {
  check(item: DefaultTouchpointRecord): string[];
}

export class DefaultTouchpointRecordPriorityRangeRule implements DefaultTouchpointRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultTouchpointRecord): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultTouchpointRecordRequiredTitleRule implements DefaultTouchpointRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultTouchpointRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultTouchpointRecordAllowedTitleRule implements DefaultTouchpointRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultTouchpointRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class DefaultTouchpointRecordLabelLengthRule implements DefaultTouchpointRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultTouchpointRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default touchpoint record. */
export class DefaultTouchpointRecordValidator {
  rules: DefaultTouchpointRecordRule[];

  constructor(rules: DefaultTouchpointRecordRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultTouchpointRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultTouchpointRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultTouchpointRecord[]): Map<string, string[]> {
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

export function defaultDefaultTouchpointRecordValidator(): DefaultTouchpointRecordValidator {
  return new DefaultTouchpointRecordValidator(
    [
      new DefaultTouchpointRecordPriorityRangeRule(16, 255),
      new DefaultTouchpointRecordRequiredTitleRule("default touchpoint record needs this field"),
      new DefaultTouchpointRecordAllowedTitleRule(["adaptive"]),
      new DefaultTouchpointRecordLabelLengthRule(80),
    ],
  );
}
