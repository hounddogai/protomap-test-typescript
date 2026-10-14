import { ScheduledPreferenceAllocation } from "./scheduled-preference-allocation.js";

/** A rule a scheduled preference allocation must pass. Check returns its problems, or none. */
export interface ScheduledPreferenceAllocationRule {
  check(item: ScheduledPreferenceAllocation): string[];
}

export class ScheduledPreferenceAllocationRequiredTitleRule implements ScheduledPreferenceAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPreferenceAllocation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPreferenceAllocationChannelLengthRule implements ScheduledPreferenceAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPreferenceAllocation): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPreferenceAllocationSummaryLengthRule implements ScheduledPreferenceAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPreferenceAllocation): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled preference allocation. */
export class ScheduledPreferenceAllocationValidator {
  rules: ScheduledPreferenceAllocationRule[];

  constructor(rules: ScheduledPreferenceAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPreferenceAllocation): string[] {
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

  requireValid(item: ScheduledPreferenceAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPreferenceAllocation[]): Map<string, string[]> {
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

export function defaultScheduledPreferenceAllocationValidator(): ScheduledPreferenceAllocationValidator {
  return new ScheduledPreferenceAllocationValidator(
    [
      new ScheduledPreferenceAllocationRequiredTitleRule("scheduled preference allocation needs this field"),
      new ScheduledPreferenceAllocationChannelLengthRule(64),
      new ScheduledPreferenceAllocationSummaryLengthRule(64),
    ],
  );
}
