import * as text from "../../../../kit/text.js";
import { ScheduledPacingBaseline } from "./scheduled-pacing-baseline.js";

/** A rule a scheduled pacing baseline must pass. Check returns its problems, or none. */
export interface ScheduledPacingBaselineRule {
  check(item: ScheduledPacingBaseline): string[];
}

export class ScheduledPacingBaselineCodeLengthRule implements ScheduledPacingBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPacingBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPacingBaselineLabelLengthRule implements ScheduledPacingBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPacingBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPacingBaselineRequiredLabelRule implements ScheduledPacingBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPacingBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPacingBaselineBidRangeRule implements ScheduledPacingBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPacingBaseline): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledPacingBaselineAllowedCodeRule implements ScheduledPacingBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPacingBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class ScheduledPacingBaselineDurationMinutesRangeRule implements ScheduledPacingBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPacingBaseline): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled pacing baseline. */
export class ScheduledPacingBaselineValidator {
  rules: ScheduledPacingBaselineRule[];

  constructor(rules: ScheduledPacingBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPacingBaseline): string[] {
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

  requireValid(item: ScheduledPacingBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPacingBaseline[]): Map<string, string[]> {
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

export function defaultScheduledPacingBaselineValidator(): ScheduledPacingBaselineValidator {
  return new ScheduledPacingBaselineValidator(
    [
      new ScheduledPacingBaselineCodeLengthRule(120),
      new ScheduledPacingBaselineLabelLengthRule(64),
      new ScheduledPacingBaselineRequiredLabelRule("scheduled pacing baseline needs this field"),
      new ScheduledPacingBaselineBidRangeRule(5.7, 3616.4),
      new ScheduledPacingBaselineAllowedCodeRule([]),
      new ScheduledPacingBaselineDurationMinutesRangeRule(32, 64),
    ],
  );
}
