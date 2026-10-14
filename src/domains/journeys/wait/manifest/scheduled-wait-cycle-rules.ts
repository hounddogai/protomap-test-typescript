import { ScheduledWaitCycle } from "./scheduled-wait-cycle.js";

/** A rule a scheduled wait cycle must pass. Check returns its problems, or none. */
export interface ScheduledWaitCycleRule {
  check(item: ScheduledWaitCycle): string[];
}

export class ScheduledWaitCycleClicksRangeRule implements ScheduledWaitCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWaitCycle): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledWaitCycleCodeLengthRule implements ScheduledWaitCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWaitCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWaitCycleTitleLengthRule implements ScheduledWaitCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWaitCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWaitCycleRequiredCountryRule implements ScheduledWaitCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWaitCycle): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled wait cycle. */
export class ScheduledWaitCycleValidator {
  rules: ScheduledWaitCycleRule[];

  constructor(rules: ScheduledWaitCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWaitCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledWaitCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWaitCycle[]): Map<string, string[]> {
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

export function defaultScheduledWaitCycleValidator(): ScheduledWaitCycleValidator {
  return new ScheduledWaitCycleValidator(
    [
      new ScheduledWaitCycleClicksRangeRule(255, 86400),
      new ScheduledWaitCycleCodeLengthRule(1000),
      new ScheduledWaitCycleTitleLengthRule(3600),
      new ScheduledWaitCycleRequiredCountryRule("scheduled wait cycle needs a value"),
    ],
  );
}
