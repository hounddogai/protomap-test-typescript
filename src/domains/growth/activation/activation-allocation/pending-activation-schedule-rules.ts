import * as text from "../../../../kit/text.js";
import { PendingActivationSchedule } from "./pending-activation-schedule.js";

/** A rule a pending activation schedule must pass. Check returns its problems, or none. */
export interface PendingActivationScheduleRule {
  check(item: PendingActivationSchedule): string[];
}

export class PendingActivationScheduleRequiredRegionRule implements PendingActivationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingActivationSchedule): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PendingActivationScheduleLabelLengthRule implements PendingActivationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingActivationSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingActivationScheduleConversionRateRangeRule implements PendingActivationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingActivationSchedule): string[] {
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

export class PendingActivationScheduleRequiredTimezoneRule implements PendingActivationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingActivationSchedule): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingActivationScheduleAllowedTimezoneRule implements PendingActivationScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingActivationSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is below minimum`];
    return [];
  }
}

export class PendingActivationScheduleCeilingRangeRule implements PendingActivationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingActivationSchedule): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending activation schedule. */
export class PendingActivationScheduleValidator {
  rules: PendingActivationScheduleRule[];

  constructor(rules: PendingActivationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingActivationSchedule): string[] {
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

  requireValid(item: PendingActivationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingActivationSchedule[]): Map<string, string[]> {
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

export function defaultPendingActivationScheduleValidator(): PendingActivationScheduleValidator {
  return new PendingActivationScheduleValidator(
    [
      new PendingActivationScheduleRequiredRegionRule("pending activation schedule needs an entry"),
      new PendingActivationScheduleLabelLengthRule(80),
      new PendingActivationScheduleConversionRateRangeRule(9.9, 3370.5),
      new PendingActivationScheduleRequiredTimezoneRule("pending activation schedule needs an entry"),
      new PendingActivationScheduleAllowedTimezoneRule(["seasonal", "adaptive"]),
      new PendingActivationScheduleCeilingRangeRule(4.4, 1701.9),
    ],
  );
}
