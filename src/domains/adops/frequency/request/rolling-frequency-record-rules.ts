import * as text from "../../../../kit/text.js";
import { RollingFrequencyRecord } from "./rolling-frequency-record.js";

/** A rule a rolling frequency record must pass. Check returns its problems, or none. */
export interface RollingFrequencyRecordRule {
  check(item: RollingFrequencyRecord): string[];
}

export class RollingFrequencyRecordTagsLimitRule implements RollingFrequencyRecordRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RollingFrequencyRecord): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class RollingFrequencyRecordAllowedAudienceIdRule implements RollingFrequencyRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingFrequencyRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is blocked`];
    return [];
  }
}

export class RollingFrequencyRecordStartsAtRangeRule implements RollingFrequencyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFrequencyRecord): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingFrequencyRecordQuantityRangeRule implements RollingFrequencyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFrequencyRecord): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingFrequencyRecordTimezoneLengthRule implements RollingFrequencyRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFrequencyRecord): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling frequency record. */
export class RollingFrequencyRecordValidator {
  rules: RollingFrequencyRecordRule[];

  constructor(rules: RollingFrequencyRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFrequencyRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingFrequencyRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFrequencyRecord[]): Map<string, string[]> {
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

export function defaultRollingFrequencyRecordValidator(): RollingFrequencyRecordValidator {
  return new RollingFrequencyRecordValidator(
    [
      new RollingFrequencyRecordTagsLimitRule(120, []),
      new RollingFrequencyRecordAllowedAudienceIdRule(["lenient", "strict"]),
      new RollingFrequencyRecordStartsAtRangeRule(64, 255),
      new RollingFrequencyRecordQuantityRangeRule(80, 1000),
      new RollingFrequencyRecordTimezoneLengthRule(120),
    ],
  );
}
