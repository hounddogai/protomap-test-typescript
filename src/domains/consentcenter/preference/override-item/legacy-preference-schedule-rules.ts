import * as text from "../../../../kit/text.js";
import { LegacyPreferenceSchedule } from "./legacy-preference-schedule.js";

/** A rule a legacy preference schedule must pass. Check returns its problems, or none. */
export interface LegacyPreferenceScheduleRule {
  check(item: LegacyPreferenceSchedule): string[];
}

export class LegacyPreferenceScheduleCodeLengthRule implements LegacyPreferenceScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPreferenceSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPreferenceScheduleRequiredCodeRule implements LegacyPreferenceScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPreferenceSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPreferenceScheduleAllowedExternalRefRule implements LegacyPreferenceScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyPreferenceSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is not allowed`];
    return [];
  }
}

export class LegacyPreferenceScheduleRequiredChannelRule implements LegacyPreferenceScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPreferenceSchedule): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy preference schedule. */
export class LegacyPreferenceScheduleValidator {
  rules: LegacyPreferenceScheduleRule[];

  constructor(rules: LegacyPreferenceScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPreferenceSchedule): string[] {
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

  requireValid(item: LegacyPreferenceSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPreferenceSchedule[]): Map<string, string[]> {
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

export function defaultLegacyPreferenceScheduleValidator(): LegacyPreferenceScheduleValidator {
  return new LegacyPreferenceScheduleValidator(
    [
      new LegacyPreferenceScheduleCodeLengthRule(3600),
      new LegacyPreferenceScheduleRequiredCodeRule("legacy preference schedule needs an entry"),
      new LegacyPreferenceScheduleAllowedExternalRefRule(["pending", "scheduled", "primary"]),
      new LegacyPreferenceScheduleRequiredChannelRule("legacy preference schedule needs an entry"),
    ],
  );
}
