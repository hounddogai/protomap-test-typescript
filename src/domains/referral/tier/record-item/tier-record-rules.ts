import * as text from "../../../../kit/text.js";
import { TierRecord } from "./tier-record.js";

/** A rule a tier record must pass. Check returns its problems, or none. */
export interface TierRecordRule {
  check(item: TierRecord): string[];
}

export class TierRecordRequiredCodeRule implements TierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierRecordLabelLengthRule implements TierRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierRecordUpdatedAtRangeRule implements TierRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierRecord): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TierRecordAllowedCodeRule implements TierRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class TierRecordCodePrefixRule implements TierRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TierRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tier record. */
export class TierRecordValidator {
  rules: TierRecordRule[];

  constructor(rules: TierRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TierRecord): string[] {
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

  requireValid(item: TierRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierRecord[]): Map<string, string[]> {
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

export function defaultTierRecordValidator(): TierRecordValidator {
  return new TierRecordValidator(
    [
      new TierRecordRequiredCodeRule("tier record needs a value"),
      new TierRecordLabelLengthRule(32),
      new TierRecordUpdatedAtRangeRule(32, 64),
      new TierRecordAllowedCodeRule(["scheduled"]),
      new TierRecordCodePrefixRule("ACM"),
    ],
  );
}
