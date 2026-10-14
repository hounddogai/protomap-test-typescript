import { RegionalStreakSchedule } from "./regional-streak-schedule.js";

/** A rule a regional streak schedule must pass. Check returns its problems, or none. */
export interface RegionalStreakScheduleRule {
  check(item: RegionalStreakSchedule): string[];
}

export class RegionalStreakScheduleRequiredLabelRule implements RegionalStreakScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStreakSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalStreakScheduleVersionRangeRule implements RegionalStreakScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStreakSchedule): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalStreakScheduleQuantityRangeRule implements RegionalStreakScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStreakSchedule): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalStreakScheduleCodePrefixRule implements RegionalStreakScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalStreakSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalStreakScheduleLabelLengthRule implements RegionalStreakScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStreakSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalStreakScheduleCampaignRefLengthRule implements RegionalStreakScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStreakSchedule): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional streak schedule. */
export class RegionalStreakScheduleValidator {
  rules: RegionalStreakScheduleRule[];

  constructor(rules: RegionalStreakScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalStreakSchedule): string[] {
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

  requireValid(item: RegionalStreakSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalStreakSchedule[]): Map<string, string[]> {
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

export function defaultRegionalStreakScheduleValidator(): RegionalStreakScheduleValidator {
  return new RegionalStreakScheduleValidator(
    [
      new RegionalStreakScheduleRequiredLabelRule("regional streak schedule needs a value"),
      new RegionalStreakScheduleVersionRangeRule(3600, 86400),
      new RegionalStreakScheduleQuantityRangeRule(16, 120),
      new RegionalStreakScheduleCodePrefixRule("Q"),
      new RegionalStreakScheduleLabelLengthRule(255),
      new RegionalStreakScheduleCampaignRefLengthRule(16),
    ],
  );
}
