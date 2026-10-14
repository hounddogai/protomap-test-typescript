import { RegionalReplySchedule } from "./regional-reply-schedule.js";

/** A rule a regional reply schedule must pass. Check returns its problems, or none. */
export interface RegionalReplyScheduleRule {
  check(item: RegionalReplySchedule): string[];
}

export class RegionalReplyScheduleRequiredContactEmailRule implements RegionalReplyScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReplySchedule): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReplyScheduleCreatedAtRangeRule implements RegionalReplyScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReplySchedule): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalReplyScheduleStartsAtRangeRule implements RegionalReplyScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReplySchedule): string[] {
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

export class RegionalReplyScheduleQuantityRangeRule implements RegionalReplyScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReplySchedule): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional reply schedule. */
export class RegionalReplyScheduleValidator {
  rules: RegionalReplyScheduleRule[];

  constructor(rules: RegionalReplyScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReplySchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalReplySchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReplySchedule[]): Map<string, string[]> {
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

export function defaultRegionalReplyScheduleValidator(): RegionalReplyScheduleValidator {
  return new RegionalReplyScheduleValidator(
    [
      new RegionalReplyScheduleRequiredContactEmailRule("regional reply schedule needs a value"),
      new RegionalReplyScheduleCreatedAtRangeRule(64, 255),
      new RegionalReplyScheduleStartsAtRangeRule(64, 80),
      new RegionalReplyScheduleQuantityRangeRule(32, 86400),
    ],
  );
}
