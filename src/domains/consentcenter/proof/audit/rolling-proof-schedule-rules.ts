import { RollingProofSchedule } from "./rolling-proof-schedule.js";

/** A rule a rolling proof schedule must pass. Check returns its problems, or none. */
export interface RollingProofScheduleRule {
  check(item: RollingProofSchedule): string[];
}

export class RollingProofScheduleNameLengthRule implements RollingProofScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingProofSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingProofScheduleRequiredCodeRule implements RollingProofScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingProofSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingProofScheduleCodePrefixRule implements RollingProofScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingProofSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingProofScheduleRequiredTimezoneRule implements RollingProofScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingProofSchedule): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling proof schedule. */
export class RollingProofScheduleValidator {
  rules: RollingProofScheduleRule[];

  constructor(rules: RollingProofScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingProofSchedule): string[] {
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

  requireValid(item: RollingProofSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingProofSchedule[]): Map<string, string[]> {
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

export function defaultRollingProofScheduleValidator(): RollingProofScheduleValidator {
  return new RollingProofScheduleValidator(
    [
      new RollingProofScheduleNameLengthRule(255),
      new RollingProofScheduleRequiredCodeRule("rolling proof schedule needs this field"),
      new RollingProofScheduleCodePrefixRule("X"),
      new RollingProofScheduleRequiredTimezoneRule("rolling proof schedule needs an entry"),
    ],
  );
}
