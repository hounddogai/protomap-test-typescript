import * as text from "../../../../kit/text.js";
import { SenderSchedule } from "./sender-schedule.js";

/** A rule a sender schedule must pass. Check returns its problems, or none. */
export interface SenderScheduleRule {
  check(item: SenderSchedule): string[];
}

export class SenderScheduleRequiredCodeRule implements SenderScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderScheduleVisibleGuardRule implements SenderScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SenderSchedule): string[] {
    if (item.visible && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SenderScheduleAllowedCodeRule implements SenderScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

/** Runs every rule of a sender schedule. */
export class SenderScheduleValidator {
  rules: SenderScheduleRule[];

  constructor(rules: SenderScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: SenderSchedule): string[] {
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

  requireValid(item: SenderSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderSchedule[]): Map<string, string[]> {
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

export function defaultSenderScheduleValidator(): SenderScheduleValidator {
  return new SenderScheduleValidator(
    [
      new SenderScheduleRequiredCodeRule("sender schedule needs this field"),
      new SenderScheduleVisibleGuardRule(16),
      new SenderScheduleAllowedCodeRule(["default"]),
    ],
  );
}
