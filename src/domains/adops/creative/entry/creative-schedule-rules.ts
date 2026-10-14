import * as text from "../../../../kit/text.js";
import { CreativeSchedule } from "./creative-schedule.js";

/** A rule a creative schedule must pass. Check returns its problems, or none. */
export interface CreativeScheduleRule {
  check(item: CreativeSchedule): string[];
}

export class CreativeScheduleAllowedCodeRule implements CreativeScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class CreativeScheduleTimezoneLengthRule implements CreativeScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeSchedule): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeScheduleDescriptionLengthRule implements CreativeScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeSchedule): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeScheduleRequiredTitleRule implements CreativeScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeScheduleRequiredCodeRule implements CreativeScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeScheduleRevisionRangeRule implements CreativeScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeSchedule): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a creative schedule. */
export class CreativeScheduleValidator {
  rules: CreativeScheduleRule[];

  constructor(rules: CreativeScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeSchedule): string[] {
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

  requireValid(item: CreativeSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeSchedule[]): Map<string, string[]> {
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

export function defaultCreativeScheduleValidator(): CreativeScheduleValidator {
  return new CreativeScheduleValidator(
    [
      new CreativeScheduleAllowedCodeRule(["lenient"]),
      new CreativeScheduleTimezoneLengthRule(64),
      new CreativeScheduleDescriptionLengthRule(16),
      new CreativeScheduleRequiredTitleRule("creative schedule needs a value"),
      new CreativeScheduleRequiredCodeRule("creative schedule needs a value"),
      new CreativeScheduleRevisionRangeRule(80, 80),
    ],
  );
}
