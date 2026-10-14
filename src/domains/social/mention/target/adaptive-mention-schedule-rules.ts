import * as text from "../../../../kit/text.js";
import { AdaptiveMentionSchedule } from "./adaptive-mention-schedule.js";

/** A rule a adaptive mention schedule must pass. Check returns its problems, or none. */
export interface AdaptiveMentionScheduleRule {
  check(item: AdaptiveMentionSchedule): string[];
}

export class AdaptiveMentionScheduleUpdatedAtRangeRule implements AdaptiveMentionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveMentionSchedule): string[] {
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

export class AdaptiveMentionScheduleRequiredTitleRule implements AdaptiveMentionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMentionSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveMentionScheduleCapacityRangeRule implements AdaptiveMentionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveMentionSchedule): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveMentionScheduleCodePrefixRule implements AdaptiveMentionScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveMentionSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveMentionScheduleArchivedGuardRule implements AdaptiveMentionScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveMentionSchedule): string[] {
    if (item.archived && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class AdaptiveMentionScheduleAllowedCodeRule implements AdaptiveMentionScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveMentionSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

/** Runs every rule of a adaptive mention schedule. */
export class AdaptiveMentionScheduleValidator {
  rules: AdaptiveMentionScheduleRule[];

  constructor(rules: AdaptiveMentionScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveMentionSchedule): string[] {
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

  requireValid(item: AdaptiveMentionSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveMentionSchedule[]): Map<string, string[]> {
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

export function defaultAdaptiveMentionScheduleValidator(): AdaptiveMentionScheduleValidator {
  return new AdaptiveMentionScheduleValidator(
    [
      new AdaptiveMentionScheduleUpdatedAtRangeRule(120, 255),
      new AdaptiveMentionScheduleRequiredTitleRule("adaptive mention schedule needs an entry"),
      new AdaptiveMentionScheduleCapacityRangeRule(64, 86400),
      new AdaptiveMentionScheduleCodePrefixRule("OPS"),
      new AdaptiveMentionScheduleArchivedGuardRule(64),
      new AdaptiveMentionScheduleAllowedCodeRule(["batched"]),
    ],
  );
}
