import { WeightedCreditSchedule } from "./weighted-credit-schedule.js";

/** A rule a weighted credit schedule must pass. Check returns its problems, or none. */
export interface WeightedCreditScheduleRule {
  check(item: WeightedCreditSchedule): string[];
}

export class WeightedCreditScheduleRequiredCodeRule implements WeightedCreditScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreditSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreditScheduleRequiredCampaignRefRule implements WeightedCreditScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreditSchedule): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreditScheduleOpenRateRangeRule implements WeightedCreditScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCreditSchedule): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedCreditScheduleNameLengthRule implements WeightedCreditScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreditSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted credit schedule. */
export class WeightedCreditScheduleValidator {
  rules: WeightedCreditScheduleRule[];

  constructor(rules: WeightedCreditScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCreditSchedule): string[] {
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

  requireValid(item: WeightedCreditSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCreditSchedule[]): Map<string, string[]> {
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

export function defaultWeightedCreditScheduleValidator(): WeightedCreditScheduleValidator {
  return new WeightedCreditScheduleValidator(
    [
      new WeightedCreditScheduleRequiredCodeRule("weighted credit schedule needs this field"),
      new WeightedCreditScheduleRequiredCampaignRefRule("weighted credit schedule needs a value"),
      new WeightedCreditScheduleOpenRateRangeRule(8.9, 2783.5),
      new WeightedCreditScheduleNameLengthRule(3600),
    ],
  );
}
