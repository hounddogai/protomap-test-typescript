import { DefaultPreferenceSchedule } from "./default-preference-schedule.js";

/** A rule a default preference schedule must pass. Check returns its problems, or none. */
export interface DefaultPreferenceScheduleRule {
  check(item: DefaultPreferenceSchedule): string[];
}

export class DefaultPreferenceScheduleRequiredTitleRule implements DefaultPreferenceScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPreferenceSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPreferenceScheduleCodePrefixRule implements DefaultPreferenceScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPreferenceSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPreferenceScheduleRequiredAudienceIdRule implements DefaultPreferenceScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPreferenceSchedule): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPreferenceScheduleTitleLengthRule implements DefaultPreferenceScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPreferenceSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPreferenceScheduleRequiredCodeRule implements DefaultPreferenceScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPreferenceSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default preference schedule. */
export class DefaultPreferenceScheduleValidator {
  rules: DefaultPreferenceScheduleRule[];

  constructor(rules: DefaultPreferenceScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPreferenceSchedule): string[] {
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

  requireValid(item: DefaultPreferenceSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPreferenceSchedule[]): Map<string, string[]> {
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

export function defaultDefaultPreferenceScheduleValidator(): DefaultPreferenceScheduleValidator {
  return new DefaultPreferenceScheduleValidator(
    [
      new DefaultPreferenceScheduleRequiredTitleRule("default preference schedule needs an entry"),
      new DefaultPreferenceScheduleCodePrefixRule("Q"),
      new DefaultPreferenceScheduleRequiredAudienceIdRule("default preference schedule needs an entry"),
      new DefaultPreferenceScheduleTitleLengthRule(16),
      new DefaultPreferenceScheduleRequiredCodeRule("default preference schedule needs a value"),
    ],
  );
}
