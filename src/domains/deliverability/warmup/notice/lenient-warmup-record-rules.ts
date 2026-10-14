import * as text from "../../../../kit/text.js";
import { LenientWarmupRecord } from "./lenient-warmup-record.js";

/** A rule a lenient warmup record must pass. Check returns its problems, or none. */
export interface LenientWarmupRecordRule {
  check(item: LenientWarmupRecord): string[];
}

export class LenientWarmupRecordRequiredTitleRule implements LenientWarmupRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWarmupRecordAllowedTitleRule implements LenientWarmupRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientWarmupRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class LenientWarmupRecordStartsAtRangeRule implements LenientWarmupRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWarmupRecord): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientWarmupRecordRequiredNameRule implements LenientWarmupRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWarmupRecordNameLengthRule implements LenientWarmupRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWarmupRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient warmup record. */
export class LenientWarmupRecordValidator {
  rules: LenientWarmupRecordRule[];

  constructor(rules: LenientWarmupRecordRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWarmupRecord): string[] {
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

  requireValid(item: LenientWarmupRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWarmupRecord[]): Map<string, string[]> {
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

export function defaultLenientWarmupRecordValidator(): LenientWarmupRecordValidator {
  return new LenientWarmupRecordValidator(
    [
      new LenientWarmupRecordRequiredTitleRule("lenient warmup record needs a value"),
      new LenientWarmupRecordAllowedTitleRule(["batched", "tiered"]),
      new LenientWarmupRecordStartsAtRangeRule(16, 255),
      new LenientWarmupRecordRequiredNameRule("lenient warmup record needs this field"),
      new LenientWarmupRecordNameLengthRule(255),
    ],
  );
}
