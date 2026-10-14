import { StepSchedule } from "./step-schedule.js";

/** A rule a step schedule must pass. Check returns its problems, or none. */
export interface StepScheduleRule {
  check(item: StepSchedule): string[];
}

export class StepScheduleDescriptionLengthRule implements StepScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSchedule): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepScheduleNameLengthRule implements StepScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepScheduleExternalRefLengthRule implements StepScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSchedule): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepScheduleAmountRangeRule implements StepScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepSchedule): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepScheduleRequiredNameRule implements StepScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StepScheduleCodePrefixRule implements StepScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a step schedule. */
export class StepScheduleValidator {
  rules: StepScheduleRule[];

  constructor(rules: StepScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: StepSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepSchedule[]): Map<string, string[]> {
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

export function defaultStepScheduleValidator(): StepScheduleValidator {
  return new StepScheduleValidator(
    [
      new StepScheduleDescriptionLengthRule(16),
      new StepScheduleNameLengthRule(32),
      new StepScheduleExternalRefLengthRule(3600),
      new StepScheduleAmountRangeRule(7.8, 2156.4),
      new StepScheduleRequiredNameRule("step schedule needs an entry"),
      new StepScheduleCodePrefixRule("Q"),
    ],
  );
}
