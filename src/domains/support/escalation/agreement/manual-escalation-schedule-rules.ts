import { ManualEscalationSchedule } from "./manual-escalation-schedule.js";

/** A rule a manual escalation schedule must pass. Check returns its problems, or none. */
export interface ManualEscalationScheduleRule {
  check(item: ManualEscalationSchedule): string[];
}

export class ManualEscalationScheduleRequiredTitleRule implements ManualEscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEscalationSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEscalationScheduleCodePrefixRule implements ManualEscalationScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualEscalationSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualEscalationScheduleCeilingRangeRule implements ManualEscalationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualEscalationSchedule): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualEscalationScheduleRequiredPhoneRule implements ManualEscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEscalationSchedule): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEscalationScheduleTitleLengthRule implements ManualEscalationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEscalationSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualEscalationScheduleRequiredSummaryRule implements ManualEscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEscalationSchedule): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual escalation schedule. */
export class ManualEscalationScheduleValidator {
  rules: ManualEscalationScheduleRule[];

  constructor(rules: ManualEscalationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ManualEscalationSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualEscalationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualEscalationSchedule[]): Map<string, string[]> {
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

export function defaultManualEscalationScheduleValidator(): ManualEscalationScheduleValidator {
  return new ManualEscalationScheduleValidator(
    [
      new ManualEscalationScheduleRequiredTitleRule("manual escalation schedule needs this field"),
      new ManualEscalationScheduleCodePrefixRule("Q"),
      new ManualEscalationScheduleCeilingRangeRule(3.3, 2610.6),
      new ManualEscalationScheduleRequiredPhoneRule("manual escalation schedule needs this field"),
      new ManualEscalationScheduleTitleLengthRule(120),
      new ManualEscalationScheduleRequiredSummaryRule("manual escalation schedule needs an entry"),
    ],
  );
}
