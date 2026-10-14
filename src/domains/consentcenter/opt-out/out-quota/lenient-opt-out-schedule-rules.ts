import { LenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

/** A rule a lenient opt out schedule must pass. Check returns its problems, or none. */
export interface LenientOptOutScheduleRule {
  check(item: LenientOptOutSchedule): string[];
}

export class LenientOptOutScheduleCodePrefixRule implements LenientOptOutScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientOptOutSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientOptOutScheduleSegmentLengthRule implements LenientOptOutScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutSchedule): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientOptOutScheduleCodeLengthRule implements LenientOptOutScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientOptOutScheduleNameLengthRule implements LenientOptOutScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient opt out schedule. */
export class LenientOptOutScheduleValidator {
  rules: LenientOptOutScheduleRule[];

  constructor(rules: LenientOptOutScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientOptOutSchedule): string[] {
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

  requireValid(item: LenientOptOutSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientOptOutSchedule[]): Map<string, string[]> {
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

export function defaultLenientOptOutScheduleValidator(): LenientOptOutScheduleValidator {
  return new LenientOptOutScheduleValidator(
    [
      new LenientOptOutScheduleCodePrefixRule("OPS"),
      new LenientOptOutScheduleSegmentLengthRule(16),
      new LenientOptOutScheduleCodeLengthRule(120),
      new LenientOptOutScheduleNameLengthRule(16),
    ],
  );
}
