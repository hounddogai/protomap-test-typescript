import * as text from "../../../../kit/text.js";
import { ScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

/** A rule a scheduled touchpoint record must pass. Check returns its problems, or none. */
export interface ScheduledTouchpointRecordRule {
  check(item: ScheduledTouchpointRecord): string[];
}

export class ScheduledTouchpointRecordExpiresAtRangeRule implements ScheduledTouchpointRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointRecord): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledTouchpointRecordRequiredContactEmailRule implements ScheduledTouchpointRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTouchpointRecord): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTouchpointRecordRequiredCodeRule implements ScheduledTouchpointRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTouchpointRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTouchpointRecordAllowedTitleRule implements ScheduledTouchpointRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledTouchpointRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class ScheduledTouchpointRecordTitleLengthRule implements ScheduledTouchpointRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTouchpointRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled touchpoint record. */
export class ScheduledTouchpointRecordValidator {
  rules: ScheduledTouchpointRecordRule[];

  constructor(rules: ScheduledTouchpointRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledTouchpointRecord): string[] {
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

  requireValid(item: ScheduledTouchpointRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledTouchpointRecord[]): Map<string, string[]> {
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

export function defaultScheduledTouchpointRecordValidator(): ScheduledTouchpointRecordValidator {
  return new ScheduledTouchpointRecordValidator(
    [
      new ScheduledTouchpointRecordExpiresAtRangeRule(64, 255),
      new ScheduledTouchpointRecordRequiredContactEmailRule("scheduled touchpoint record needs a value"),
      new ScheduledTouchpointRecordRequiredCodeRule("scheduled touchpoint record needs a value"),
      new ScheduledTouchpointRecordAllowedTitleRule(["legacy", "global"]),
      new ScheduledTouchpointRecordTitleLengthRule(255),
    ],
  );
}
