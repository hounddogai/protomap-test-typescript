import { DefaultModelGroup } from "./default-model-group.js";

/** A rule a default model group must pass. Check returns its problems, or none. */
export interface DefaultModelGroupRule {
  check(item: DefaultModelGroup): string[];
}

export class DefaultModelGroupDurationMinutesRangeRule implements DefaultModelGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultModelGroup): string[] {
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

export class DefaultModelGroupRequiredCodeRule implements DefaultModelGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultModelGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultModelGroupTitleLengthRule implements DefaultModelGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultModelGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultModelGroupRequiredTitleRule implements DefaultModelGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultModelGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default model group. */
export class DefaultModelGroupValidator {
  rules: DefaultModelGroupRule[];

  constructor(rules: DefaultModelGroupRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultModelGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultModelGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultModelGroup[]): Map<string, string[]> {
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

export function defaultDefaultModelGroupValidator(): DefaultModelGroupValidator {
  return new DefaultModelGroupValidator(
    [
      new DefaultModelGroupDurationMinutesRangeRule(32, 255),
      new DefaultModelGroupRequiredCodeRule("default model group needs this field"),
      new DefaultModelGroupTitleLengthRule(86400),
      new DefaultModelGroupRequiredTitleRule("default model group needs a value"),
    ],
  );
}
