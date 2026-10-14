import * as text from "../../../../kit/text.js";
import { RollingMentionRecord } from "./rolling-mention-record.js";

/** A rule a rolling mention record must pass. Check returns its problems, or none. */
export interface RollingMentionRecordRule {
  check(item: RollingMentionRecord): string[];
}

export class RollingMentionRecordPriorityRangeRule implements RollingMentionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMentionRecord): string[] {
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

export class RollingMentionRecordEndsAtRangeRule implements RollingMentionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMentionRecord): string[] {
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

export class RollingMentionRecordVisibleGuardRule implements RollingMentionRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingMentionRecord): string[] {
    if (item.visible && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class RollingMentionRecordCodePrefixRule implements RollingMentionRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingMentionRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingMentionRecordAllowedNameRule implements RollingMentionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingMentionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class RollingMentionRecordNameLengthRule implements RollingMentionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingMentionRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling mention record. */
export class RollingMentionRecordValidator {
  rules: RollingMentionRecordRule[];

  constructor(rules: RollingMentionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RollingMentionRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingMentionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingMentionRecord[]): Map<string, string[]> {
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

export function defaultRollingMentionRecordValidator(): RollingMentionRecordValidator {
  return new RollingMentionRecordValidator(
    [
      new RollingMentionRecordPriorityRangeRule(64, 3600),
      new RollingMentionRecordEndsAtRangeRule(64, 255),
      new RollingMentionRecordVisibleGuardRule(1000),
      new RollingMentionRecordCodePrefixRule("REF"),
      new RollingMentionRecordAllowedNameRule(["capped"]),
      new RollingMentionRecordNameLengthRule(1000),
    ],
  );
}
