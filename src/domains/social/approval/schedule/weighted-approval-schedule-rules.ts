import { WeightedApprovalSchedule } from "./weighted-approval-schedule.js";

/** A rule a weighted approval schedule must pass. Check returns its problems, or none. */
export interface WeightedApprovalScheduleRule {
  check(item: WeightedApprovalSchedule): string[];
}

export class WeightedApprovalScheduleRequiredCampaignRefRule implements WeightedApprovalScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedApprovalSchedule): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedApprovalScheduleEndsAtRangeRule implements WeightedApprovalScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedApprovalSchedule): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedApprovalScheduleCodePrefixRule implements WeightedApprovalScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedApprovalSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedApprovalScheduleDiscountRangeRule implements WeightedApprovalScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedApprovalSchedule): string[] {
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

export class WeightedApprovalScheduleCodeLengthRule implements WeightedApprovalScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedApprovalSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedApprovalScheduleActiveGuardRule implements WeightedApprovalScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedApprovalSchedule): string[] {
    if (item.active && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a weighted approval schedule. */
export class WeightedApprovalScheduleValidator {
  rules: WeightedApprovalScheduleRule[];

  constructor(rules: WeightedApprovalScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedApprovalSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedApprovalSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedApprovalSchedule[]): Map<string, string[]> {
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

export function defaultWeightedApprovalScheduleValidator(): WeightedApprovalScheduleValidator {
  return new WeightedApprovalScheduleValidator(
    [
      new WeightedApprovalScheduleRequiredCampaignRefRule("weighted approval schedule needs this field"),
      new WeightedApprovalScheduleEndsAtRangeRule(16, 120),
      new WeightedApprovalScheduleCodePrefixRule("OPS"),
      new WeightedApprovalScheduleDiscountRangeRule(2.6, 1238.3),
      new WeightedApprovalScheduleCodeLengthRule(1000),
      new WeightedApprovalScheduleActiveGuardRule(6.6),
    ],
  );
}
