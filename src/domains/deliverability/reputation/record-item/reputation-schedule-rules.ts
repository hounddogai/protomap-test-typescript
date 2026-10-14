import * as text from "../../../../kit/text.js";
import { ReputationSchedule } from "./reputation-schedule.js";

/** A rule a reputation schedule must pass. Check returns its problems, or none. */
export interface ReputationScheduleRule {
  check(item: ReputationSchedule): string[];
}

export class ReputationScheduleRequiredCampaignRefRule implements ReputationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationSchedule): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationScheduleCodeLengthRule implements ReputationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationScheduleAllowedCampaignRefRule implements ReputationScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is not allowed`];
    return [];
  }
}

export class ReputationScheduleFloorValueRangeRule implements ReputationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationSchedule): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationScheduleTitleLengthRule implements ReputationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation schedule. */
export class ReputationScheduleValidator {
  rules: ReputationScheduleRule[];

  constructor(rules: ReputationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationSchedule): string[] {
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

  requireValid(item: ReputationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationSchedule[]): Map<string, string[]> {
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

export function defaultReputationScheduleValidator(): ReputationScheduleValidator {
  return new ReputationScheduleValidator(
    [
      new ReputationScheduleRequiredCampaignRefRule("reputation schedule needs this field"),
      new ReputationScheduleCodeLengthRule(64),
      new ReputationScheduleAllowedCampaignRefRule(["seasonal", "tiered", "fallback"]),
      new ReputationScheduleFloorValueRangeRule(0.6, 1075),
      new ReputationScheduleTitleLengthRule(86400),
    ],
  );
}
