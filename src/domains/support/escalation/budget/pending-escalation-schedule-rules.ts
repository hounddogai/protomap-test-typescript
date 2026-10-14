import { PendingEscalationSchedule } from "./pending-escalation-schedule.js";

/** A rule a pending escalation schedule must pass. Check returns its problems, or none. */
export interface PendingEscalationScheduleRule {
  check(item: PendingEscalationSchedule): string[];
}

export class PendingEscalationScheduleRequiredNameRule implements PendingEscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEscalationSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingEscalationScheduleRequiredCodeRule implements PendingEscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEscalationSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingEscalationScheduleCodePrefixRule implements PendingEscalationScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingEscalationSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingEscalationScheduleDescriptionLengthRule implements PendingEscalationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingEscalationSchedule): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending escalation schedule. */
export class PendingEscalationScheduleValidator {
  rules: PendingEscalationScheduleRule[];

  constructor(rules: PendingEscalationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingEscalationSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingEscalationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingEscalationSchedule[]): Map<string, string[]> {
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

export function defaultPendingEscalationScheduleValidator(): PendingEscalationScheduleValidator {
  return new PendingEscalationScheduleValidator(
    [
      new PendingEscalationScheduleRequiredNameRule("pending escalation schedule needs an entry"),
      new PendingEscalationScheduleRequiredCodeRule("pending escalation schedule needs a value"),
      new PendingEscalationScheduleCodePrefixRule("X"),
      new PendingEscalationScheduleDescriptionLengthRule(64),
    ],
  );
}
