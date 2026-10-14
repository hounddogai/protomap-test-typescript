import { CreditSchedule } from "./credit-schedule.js";

/** A rule a credit schedule must pass. Check returns its problems, or none. */
export interface CreditScheduleRule {
  check(item: CreditSchedule): string[];
}

export class CreditScheduleCampaignRefLengthRule implements CreditScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSchedule): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditScheduleCodeLengthRule implements CreditScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditScheduleVersionRangeRule implements CreditScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditSchedule): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditScheduleLimitRangeRule implements CreditScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditSchedule): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditScheduleRequiredCodeRule implements CreditScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit schedule. */
export class CreditScheduleValidator {
  rules: CreditScheduleRule[];

  constructor(rules: CreditScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CreditSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditSchedule[]): Map<string, string[]> {
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

export function defaultCreditScheduleValidator(): CreditScheduleValidator {
  return new CreditScheduleValidator(
    [
      new CreditScheduleCampaignRefLengthRule(64),
      new CreditScheduleCodeLengthRule(1000),
      new CreditScheduleVersionRangeRule(80, 120),
      new CreditScheduleLimitRangeRule(64, 1000),
      new CreditScheduleRequiredCodeRule("credit schedule needs a value"),
    ],
  );
}
