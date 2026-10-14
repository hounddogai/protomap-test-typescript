import { ActivationSchedule } from "./activation-schedule.js";

/** A rule a activation schedule must pass. Check returns its problems, or none. */
export interface ActivationScheduleRule {
  check(item: ActivationSchedule): string[];
}

export class ActivationScheduleCodeLengthRule implements ActivationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationScheduleRequiredCodeRule implements ActivationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationScheduleWindowDaysRangeRule implements ActivationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationSchedule): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationScheduleRequiredLabelRule implements ActivationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationScheduleCurrencyLengthRule implements ActivationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationSchedule): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationScheduleRequiredCurrencyRule implements ActivationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationSchedule): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation schedule. */
export class ActivationScheduleValidator {
  rules: ActivationScheduleRule[];

  constructor(rules: ActivationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationSchedule): string[] {
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

  requireValid(item: ActivationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationSchedule[]): Map<string, string[]> {
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

export function defaultActivationScheduleValidator(): ActivationScheduleValidator {
  return new ActivationScheduleValidator(
    [
      new ActivationScheduleCodeLengthRule(3600),
      new ActivationScheduleRequiredCodeRule("activation schedule needs an entry"),
      new ActivationScheduleWindowDaysRangeRule(120, 255),
      new ActivationScheduleRequiredLabelRule("activation schedule needs a value"),
      new ActivationScheduleCurrencyLengthRule(120),
      new ActivationScheduleRequiredCurrencyRule("activation schedule needs this field"),
    ],
  );
}
