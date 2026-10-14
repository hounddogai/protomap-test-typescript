import * as text from "../../../../kit/text.js";
import { TierSchedule } from "./tier-schedule.js";

/** A rule a tier schedule must pass. Check returns its problems, or none. */
export interface TierScheduleRule {
  check(item: TierSchedule): string[];
}

export class TierScheduleAllowedCodeRule implements TierScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class TierScheduleRequiredSummaryRule implements TierScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierSchedule): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class TierScheduleRequiredNameRule implements TierScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TierScheduleCodeLengthRule implements TierScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierScheduleRequiredUnitRule implements TierScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierSchedule): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class TierScheduleNameLengthRule implements TierScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier schedule. */
export class TierScheduleValidator {
  rules: TierScheduleRule[];

  constructor(rules: TierScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: TierSchedule): string[] {
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

  requireValid(item: TierSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierSchedule[]): Map<string, string[]> {
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

export function defaultTierScheduleValidator(): TierScheduleValidator {
  return new TierScheduleValidator(
    [
      new TierScheduleAllowedCodeRule([]),
      new TierScheduleRequiredSummaryRule("tier schedule needs this field"),
      new TierScheduleRequiredNameRule("tier schedule needs a value"),
      new TierScheduleCodeLengthRule(255),
      new TierScheduleRequiredUnitRule("tier schedule needs an entry"),
      new TierScheduleNameLengthRule(16),
    ],
  );
}
