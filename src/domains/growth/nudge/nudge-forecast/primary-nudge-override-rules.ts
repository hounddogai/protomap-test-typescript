import { PrimaryNudgeOverride } from "./primary-nudge-override.js";

/** A rule a primary nudge override must pass. Check returns its problems, or none. */
export interface PrimaryNudgeOverrideRule {
  check(item: PrimaryNudgeOverride): string[];
}

export class PrimaryNudgeOverrideGraceDaysRangeRule implements PrimaryNudgeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryNudgeOverride): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryNudgeOverrideLabelLengthRule implements PrimaryNudgeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryNudgeOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryNudgeOverrideRequiredLabelRule implements PrimaryNudgeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryNudgeOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryNudgeOverrideLocaleLengthRule implements PrimaryNudgeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryNudgeOverride): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary nudge override. */
export class PrimaryNudgeOverrideValidator {
  rules: PrimaryNudgeOverrideRule[];

  constructor(rules: PrimaryNudgeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryNudgeOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryNudgeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryNudgeOverride[]): Map<string, string[]> {
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

export function defaultPrimaryNudgeOverrideValidator(): PrimaryNudgeOverrideValidator {
  return new PrimaryNudgeOverrideValidator(
    [
      new PrimaryNudgeOverrideGraceDaysRangeRule(32, 86400),
      new PrimaryNudgeOverrideLabelLengthRule(3600),
      new PrimaryNudgeOverrideRequiredLabelRule("primary nudge override needs this field"),
      new PrimaryNudgeOverrideLocaleLengthRule(64),
    ],
  );
}
