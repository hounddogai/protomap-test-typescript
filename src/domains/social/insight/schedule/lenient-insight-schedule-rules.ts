import { LenientInsightSchedule } from "./lenient-insight-schedule.js";

/** A rule a lenient insight schedule must pass. Check returns its problems, or none. */
export interface LenientInsightScheduleRule {
  check(item: LenientInsightSchedule): string[];
}

export class LenientInsightScheduleRequiredLabelRule implements LenientInsightScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInsightSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInsightScheduleCodePrefixRule implements LenientInsightScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientInsightSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientInsightScheduleRequiredOwnerIdRule implements LenientInsightScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInsightSchedule): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInsightScheduleOwnerIdLengthRule implements LenientInsightScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInsightSchedule): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInsightScheduleRequiredCodeRule implements LenientInsightScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInsightSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient insight schedule. */
export class LenientInsightScheduleValidator {
  rules: LenientInsightScheduleRule[];

  constructor(rules: LenientInsightScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientInsightSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientInsightSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientInsightSchedule[]): Map<string, string[]> {
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

export function defaultLenientInsightScheduleValidator(): LenientInsightScheduleValidator {
  return new LenientInsightScheduleValidator(
    [
      new LenientInsightScheduleRequiredLabelRule("lenient insight schedule needs this field"),
      new LenientInsightScheduleCodePrefixRule("OPS"),
      new LenientInsightScheduleRequiredOwnerIdRule("lenient insight schedule needs this field"),
      new LenientInsightScheduleOwnerIdLengthRule(1000),
      new LenientInsightScheduleRequiredCodeRule("lenient insight schedule needs an entry"),
    ],
  );
}
