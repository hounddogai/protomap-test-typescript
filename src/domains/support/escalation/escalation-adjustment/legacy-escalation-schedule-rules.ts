import * as text from "../../../../kit/text.js";
import { LegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

/** A rule a legacy escalation schedule must pass. Check returns its problems, or none. */
export interface LegacyEscalationScheduleRule {
  check(item: LegacyEscalationSchedule): string[];
}

export class LegacyEscalationScheduleWindowRule implements LegacyEscalationScheduleRule {
  maxSpan: number;

  constructor(maxSpan: number) {
    this.maxSpan = maxSpan;
  }

  check(item: LegacyEscalationSchedule): string[] {
    if (item.startsAt > item.endsAt) return ["starts at is after ends at"];
    if (this.maxSpan > 0 && item.endsAt - item.startsAt > this.maxSpan) return [`spans more than ${this.maxSpan} seconds`];
    return [];
  }
}

export class LegacyEscalationScheduleWeightRangeRule implements LegacyEscalationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyEscalationSchedule): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyEscalationScheduleAllowedCodeRule implements LegacyEscalationScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyEscalationSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class LegacyEscalationScheduleRequiredAudienceIdRule implements LegacyEscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEscalationSchedule): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy escalation schedule. */
export class LegacyEscalationScheduleValidator {
  rules: LegacyEscalationScheduleRule[];

  constructor(rules: LegacyEscalationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyEscalationSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyEscalationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyEscalationSchedule[]): Map<string, string[]> {
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

export function defaultLegacyEscalationScheduleValidator(): LegacyEscalationScheduleValidator {
  return new LegacyEscalationScheduleValidator(
    [
      new LegacyEscalationScheduleWindowRule(255),
      new LegacyEscalationScheduleWeightRangeRule(2.3, 1300),
      new LegacyEscalationScheduleAllowedCodeRule(["pending", "regional"]),
      new LegacyEscalationScheduleRequiredAudienceIdRule("legacy escalation schedule needs a value"),
    ],
  );
}
