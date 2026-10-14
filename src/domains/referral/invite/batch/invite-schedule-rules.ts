import { InviteSchedule } from "./invite-schedule.js";

/** A rule a invite schedule must pass. Check returns its problems, or none. */
export interface InviteScheduleRule {
  check(item: InviteSchedule): string[];
}

export class InviteScheduleDiscountRangeRule implements InviteScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteSchedule): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InviteScheduleRetriesRangeRule implements InviteScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteSchedule): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteScheduleCodePrefixRule implements InviteScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteScheduleRatioRangeRule implements InviteScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteSchedule): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteScheduleCapacityRangeRule implements InviteScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteSchedule): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a invite schedule. */
export class InviteScheduleValidator {
  rules: InviteScheduleRule[];

  constructor(rules: InviteScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: InviteSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteSchedule[]): Map<string, string[]> {
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

export function defaultInviteScheduleValidator(): InviteScheduleValidator {
  return new InviteScheduleValidator(
    [
      new InviteScheduleDiscountRangeRule(7.1, 1846.5),
      new InviteScheduleRetriesRangeRule(32, 1000),
      new InviteScheduleCodePrefixRule("OPS"),
      new InviteScheduleRatioRangeRule(6.4, 3747.8),
      new InviteScheduleCapacityRangeRule(32, 3600),
    ],
  );
}
