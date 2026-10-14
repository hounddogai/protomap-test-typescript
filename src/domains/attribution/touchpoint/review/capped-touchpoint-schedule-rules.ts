import { CappedTouchpointSchedule } from "./capped-touchpoint-schedule.js";

/** A rule a capped touchpoint schedule must pass. Check returns its problems, or none. */
export interface CappedTouchpointScheduleRule {
  check(item: CappedTouchpointSchedule): string[];
}

export class CappedTouchpointScheduleCodePrefixRule implements CappedTouchpointScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedTouchpointSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedTouchpointScheduleRequiredTitleRule implements CappedTouchpointScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTouchpointSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTouchpointScheduleCodeLengthRule implements CappedTouchpointScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTouchpointSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped touchpoint schedule. */
export class CappedTouchpointScheduleValidator {
  rules: CappedTouchpointScheduleRule[];

  constructor(rules: CappedTouchpointScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTouchpointSchedule): string[] {
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

  requireValid(item: CappedTouchpointSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTouchpointSchedule[]): Map<string, string[]> {
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

export function defaultCappedTouchpointScheduleValidator(): CappedTouchpointScheduleValidator {
  return new CappedTouchpointScheduleValidator(
    [
      new CappedTouchpointScheduleCodePrefixRule("OPS"),
      new CappedTouchpointScheduleRequiredTitleRule("capped touchpoint schedule needs an entry"),
      new CappedTouchpointScheduleCodeLengthRule(3600),
    ],
  );
}
