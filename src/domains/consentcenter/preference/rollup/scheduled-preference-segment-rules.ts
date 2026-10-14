import { ScheduledPreferenceSegment } from "./scheduled-preference-segment.js";

/** A rule a scheduled preference segment must pass. Check returns its problems, or none. */
export interface ScheduledPreferenceSegmentRule {
  check(item: ScheduledPreferenceSegment): string[];
}

export class ScheduledPreferenceSegmentRequiredTimezoneRule implements ScheduledPreferenceSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPreferenceSegment): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPreferenceSegmentTimezoneLengthRule implements ScheduledPreferenceSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPreferenceSegment): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPreferenceSegmentCodePrefixRule implements ScheduledPreferenceSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPreferenceSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled preference segment. */
export class ScheduledPreferenceSegmentValidator {
  rules: ScheduledPreferenceSegmentRule[];

  constructor(rules: ScheduledPreferenceSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPreferenceSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPreferenceSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPreferenceSegment[]): Map<string, string[]> {
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

export function defaultScheduledPreferenceSegmentValidator(): ScheduledPreferenceSegmentValidator {
  return new ScheduledPreferenceSegmentValidator(
    [
      new ScheduledPreferenceSegmentRequiredTimezoneRule("scheduled preference segment needs a value"),
      new ScheduledPreferenceSegmentTimezoneLengthRule(16),
      new ScheduledPreferenceSegmentCodePrefixRule("ACM"),
    ],
  );
}
