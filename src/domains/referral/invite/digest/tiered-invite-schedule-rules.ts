import * as text from "../../../../kit/text.js";
import { TieredInviteSchedule } from "./tiered-invite-schedule.js";

/** A rule a tiered invite schedule must pass. Check returns its problems, or none. */
export interface TieredInviteScheduleRule {
  check(item: TieredInviteSchedule): string[];
}

export class TieredInviteSchedulePinnedGuardRule implements TieredInviteScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredInviteSchedule): string[] {
    if (item.pinned && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TieredInviteScheduleAllowedTitleRule implements TieredInviteScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredInviteSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class TieredInviteScheduleTitleLengthRule implements TieredInviteScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredInviteSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredInviteScheduleRequiredReviewerRule implements TieredInviteScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredInviteSchedule): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class TieredInviteScheduleRequiredTitleRule implements TieredInviteScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredInviteSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredInviteScheduleClicksRangeRule implements TieredInviteScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredInviteSchedule): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered invite schedule. */
export class TieredInviteScheduleValidator {
  rules: TieredInviteScheduleRule[];

  constructor(rules: TieredInviteScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredInviteSchedule): string[] {
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

  requireValid(item: TieredInviteSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredInviteSchedule[]): Map<string, string[]> {
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

export function defaultTieredInviteScheduleValidator(): TieredInviteScheduleValidator {
  return new TieredInviteScheduleValidator(
    [
      new TieredInviteSchedulePinnedGuardRule(80),
      new TieredInviteScheduleAllowedTitleRule(["scheduled", "batched", "scheduled"]),
      new TieredInviteScheduleTitleLengthRule(120),
      new TieredInviteScheduleRequiredReviewerRule("tiered invite schedule needs a value"),
      new TieredInviteScheduleRequiredTitleRule("tiered invite schedule needs an entry"),
      new TieredInviteScheduleClicksRangeRule(120, 3600),
    ],
  );
}
