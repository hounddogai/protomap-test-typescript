import * as text from "../../../../kit/text.js";
import { DefaultFrequencyRecord } from "./default-frequency-record.js";

/** A rule a default frequency record must pass. Check returns its problems, or none. */
export interface DefaultFrequencyRecordRule {
  check(item: DefaultFrequencyRecord): string[];
}

export class DefaultFrequencyRecordApprovedGuardRule implements DefaultFrequencyRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultFrequencyRecord): string[] {
    if (item.approved && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class DefaultFrequencyRecordCodeLengthRule implements DefaultFrequencyRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFrequencyRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFrequencyRecordAllowedNotesRule implements DefaultFrequencyRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultFrequencyRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is expired`];
    return [];
  }
}

export class DefaultFrequencyRecordUpdatedAtRangeRule implements DefaultFrequencyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFrequencyRecord): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultFrequencyRecordRequiredUtmSourceRule implements DefaultFrequencyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFrequencyRecord): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default frequency record. */
export class DefaultFrequencyRecordValidator {
  rules: DefaultFrequencyRecordRule[];

  constructor(rules: DefaultFrequencyRecordRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFrequencyRecord): string[] {
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

  requireValid(item: DefaultFrequencyRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFrequencyRecord[]): Map<string, string[]> {
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

export function defaultDefaultFrequencyRecordValidator(): DefaultFrequencyRecordValidator {
  return new DefaultFrequencyRecordValidator(
    [
      new DefaultFrequencyRecordApprovedGuardRule(120),
      new DefaultFrequencyRecordCodeLengthRule(32),
      new DefaultFrequencyRecordAllowedNotesRule(["tiered", "manual"]),
      new DefaultFrequencyRecordUpdatedAtRangeRule(64, 3600),
      new DefaultFrequencyRecordRequiredUtmSourceRule("default frequency record needs this field"),
    ],
  );
}
