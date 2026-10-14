import { LenientSlaSchedule } from "./lenient-sla-schedule.js";

/** A rule a lenient sla schedule must pass. Check returns its problems, or none. */
export interface LenientSlaScheduleRule {
  check(item: LenientSlaSchedule): string[];
}

export class LenientSlaScheduleRequiredCampaignRefRule implements LenientSlaScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSlaSchedule): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSlaScheduleRequiredCodeRule implements LenientSlaScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSlaSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSlaScheduleRequiredTitleRule implements LenientSlaScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSlaSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSlaScheduleConversionRateRangeRule implements LenientSlaScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSlaSchedule): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSlaScheduleCodeLengthRule implements LenientSlaScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSlaSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient sla schedule. */
export class LenientSlaScheduleValidator {
  rules: LenientSlaScheduleRule[];

  constructor(rules: LenientSlaScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSlaSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientSlaSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSlaSchedule[]): Map<string, string[]> {
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

export function defaultLenientSlaScheduleValidator(): LenientSlaScheduleValidator {
  return new LenientSlaScheduleValidator(
    [
      new LenientSlaScheduleRequiredCampaignRefRule("lenient sla schedule needs an entry"),
      new LenientSlaScheduleRequiredCodeRule("lenient sla schedule needs an entry"),
      new LenientSlaScheduleRequiredTitleRule("lenient sla schedule needs this field"),
      new LenientSlaScheduleConversionRateRangeRule(2.6, 4804.8),
      new LenientSlaScheduleCodeLengthRule(120),
    ],
  );
}
