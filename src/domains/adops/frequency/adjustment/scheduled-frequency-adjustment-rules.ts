import { ScheduledFrequencyAdjustment } from "./scheduled-frequency-adjustment.js";

/** A rule a scheduled frequency adjustment must pass. Check returns its problems, or none. */
export interface ScheduledFrequencyAdjustmentRule {
  check(item: ScheduledFrequencyAdjustment): string[];
}

export class ScheduledFrequencyAdjustmentUpdatedAtRangeRule implements ScheduledFrequencyAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFrequencyAdjustment): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledFrequencyAdjustmentChannelLengthRule implements ScheduledFrequencyAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFrequencyAdjustment): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFrequencyAdjustmentCodeLengthRule implements ScheduledFrequencyAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFrequencyAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFrequencyAdjustmentLimitRangeRule implements ScheduledFrequencyAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFrequencyAdjustment): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled frequency adjustment. */
export class ScheduledFrequencyAdjustmentValidator {
  rules: ScheduledFrequencyAdjustmentRule[];

  constructor(rules: ScheduledFrequencyAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFrequencyAdjustment): string[] {
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

  requireValid(item: ScheduledFrequencyAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFrequencyAdjustment[]): Map<string, string[]> {
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

export function defaultScheduledFrequencyAdjustmentValidator(): ScheduledFrequencyAdjustmentValidator {
  return new ScheduledFrequencyAdjustmentValidator(
    [
      new ScheduledFrequencyAdjustmentUpdatedAtRangeRule(32, 255),
      new ScheduledFrequencyAdjustmentChannelLengthRule(86400),
      new ScheduledFrequencyAdjustmentCodeLengthRule(3600),
      new ScheduledFrequencyAdjustmentLimitRangeRule(64, 64),
    ],
  );
}
