import * as text from "../../../../kit/text.js";
import { StrictStepSchedule } from "./strict-step-schedule.js";

/** A rule a strict step schedule must pass. Check returns its problems, or none. */
export interface StrictStepScheduleRule {
  check(item: StrictStepSchedule): string[];
}

export class StrictStepScheduleRequiredAudienceIdRule implements StrictStepScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictStepSchedule): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictStepScheduleCodePrefixRule implements StrictStepScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictStepSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictStepScheduleVisibleGuardRule implements StrictStepScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictStepSchedule): string[] {
    if (item.visible && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class StrictStepScheduleLimitRangeRule implements StrictStepScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictStepSchedule): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictStepScheduleAllowedLabelRule implements StrictStepScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictStepSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

/** Runs every rule of a strict step schedule. */
export class StrictStepScheduleValidator {
  rules: StrictStepScheduleRule[];

  constructor(rules: StrictStepScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictStepSchedule): string[] {
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

  requireValid(item: StrictStepSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictStepSchedule[]): Map<string, string[]> {
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

export function defaultStrictStepScheduleValidator(): StrictStepScheduleValidator {
  return new StrictStepScheduleValidator(
    [
      new StrictStepScheduleRequiredAudienceIdRule("strict step schedule needs an entry"),
      new StrictStepScheduleCodePrefixRule("OPS"),
      new StrictStepScheduleVisibleGuardRule(9.1),
      new StrictStepScheduleLimitRangeRule(16, 255),
      new StrictStepScheduleAllowedLabelRule(["default", "seasonal"]),
    ],
  );
}
