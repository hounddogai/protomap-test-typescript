import { TouchpointSchedule } from "./touchpoint-schedule.js";

/** A rule a touchpoint schedule must pass. Check returns its problems, or none. */
export interface TouchpointScheduleRule {
  check(item: TouchpointSchedule): string[];
}

export class TouchpointScheduleRequiredCodeRule implements TouchpointScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointScheduleRequiredNameRule implements TouchpointScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointScheduleClicksRangeRule implements TouchpointScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointSchedule): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a touchpoint schedule. */
export class TouchpointScheduleValidator {
  rules: TouchpointScheduleRule[];

  constructor(rules: TouchpointScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointSchedule[]): Map<string, string[]> {
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

export function defaultTouchpointScheduleValidator(): TouchpointScheduleValidator {
  return new TouchpointScheduleValidator(
    [
      new TouchpointScheduleRequiredCodeRule("touchpoint schedule needs a value"),
      new TouchpointScheduleRequiredNameRule("touchpoint schedule needs a value"),
      new TouchpointScheduleClicksRangeRule(80, 86400),
    ],
  );
}
