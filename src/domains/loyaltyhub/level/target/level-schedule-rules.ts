import { LevelSchedule } from "./level-schedule.js";

/** A rule a level schedule must pass. Check returns its problems, or none. */
export interface LevelScheduleRule {
  check(item: LevelSchedule): string[];
}

export class LevelScheduleCodePrefixRule implements LevelScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LevelScheduleRequiredCodeRule implements LevelScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelScheduleNameLengthRule implements LevelScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelScheduleRequiredLabelRule implements LevelScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LevelScheduleApprovedGuardRule implements LevelScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LevelSchedule): string[] {
    if (item.approved && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a level schedule. */
export class LevelScheduleValidator {
  rules: LevelScheduleRule[];

  constructor(rules: LevelScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LevelSchedule): string[] {
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

  requireValid(item: LevelSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelSchedule[]): Map<string, string[]> {
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

export function defaultLevelScheduleValidator(): LevelScheduleValidator {
  return new LevelScheduleValidator(
    [
      new LevelScheduleCodePrefixRule("Q"),
      new LevelScheduleRequiredCodeRule("level schedule needs a value"),
      new LevelScheduleNameLengthRule(64),
      new LevelScheduleRequiredLabelRule("level schedule needs an entry"),
      new LevelScheduleApprovedGuardRule(255),
    ],
  );
}
