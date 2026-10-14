import { StrictPreferencePlan } from "./strict-preference-plan.js";

/** A rule a strict preference plan must pass. Check returns its problems, or none. */
export interface StrictPreferencePlanRule {
  check(item: StrictPreferencePlan): string[];
}

export class StrictPreferencePlanFloorValueRangeRule implements StrictPreferencePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPreferencePlan): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictPreferencePlanCeilingRangeRule implements StrictPreferencePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPreferencePlan): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictPreferencePlanMaximumRangeRule implements StrictPreferencePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPreferencePlan): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPreferencePlanRequiredTitleRule implements StrictPreferencePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPreferencePlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPreferencePlanTitleLengthRule implements StrictPreferencePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPreferencePlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPreferencePlanCodeLengthRule implements StrictPreferencePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPreferencePlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict preference plan. */
export class StrictPreferencePlanValidator {
  rules: StrictPreferencePlanRule[];

  constructor(rules: StrictPreferencePlanRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPreferencePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPreferencePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPreferencePlan[]): Map<string, string[]> {
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

export function defaultStrictPreferencePlanValidator(): StrictPreferencePlanValidator {
  return new StrictPreferencePlanValidator(
    [
      new StrictPreferencePlanFloorValueRangeRule(3.4, 2490.5),
      new StrictPreferencePlanCeilingRangeRule(5.4, 777),
      new StrictPreferencePlanMaximumRangeRule(8.9, 4360),
      new StrictPreferencePlanRequiredTitleRule("strict preference plan needs this field"),
      new StrictPreferencePlanTitleLengthRule(1000),
      new StrictPreferencePlanCodeLengthRule(86400),
    ],
  );
}
