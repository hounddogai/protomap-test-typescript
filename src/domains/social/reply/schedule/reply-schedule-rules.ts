import * as text from "../../../../kit/text.js";
import { ReplySchedule } from "./reply-schedule.js";

/** A rule a reply schedule must pass. Check returns its problems, or none. */
export interface ReplyScheduleRule {
  check(item: ReplySchedule): string[];
}

export class ReplyScheduleLimitRangeRule implements ReplyScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplySchedule): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyScheduleVisibleGuardRule implements ReplyScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReplySchedule): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ReplySchedulePriorityRangeRule implements ReplyScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplySchedule): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyScheduleRequiredCodeRule implements ReplyScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplySchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyScheduleAllowedNameRule implements ReplyScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplySchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

/** Runs every rule of a reply schedule. */
export class ReplyScheduleValidator {
  rules: ReplyScheduleRule[];

  constructor(rules: ReplyScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ReplySchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplySchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplySchedule[]): Map<string, string[]> {
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

export function defaultReplyScheduleValidator(): ReplyScheduleValidator {
  return new ReplyScheduleValidator(
    [
      new ReplyScheduleLimitRangeRule(32, 1000),
      new ReplyScheduleVisibleGuardRule(86400),
      new ReplySchedulePriorityRangeRule(16, 64),
      new ReplyScheduleRequiredCodeRule("reply schedule needs a value"),
      new ReplyScheduleAllowedNameRule([]),
    ],
  );
}
