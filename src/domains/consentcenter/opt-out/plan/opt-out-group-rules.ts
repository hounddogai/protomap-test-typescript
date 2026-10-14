import { OptOutGroup } from "./opt-out-group.js";

/** A rule a opt out group must pass. Check returns its problems, or none. */
export interface OptOutGroupRule {
  check(item: OptOutGroup): string[];
}

export class OptOutGroupLabelLengthRule implements OptOutGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutGroupMaximumRangeRule implements OptOutGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutGroup): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class OptOutGroupRequiredCodeRule implements OptOutGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutGroupRequiredLabelRule implements OptOutGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out group. */
export class OptOutGroupValidator {
  rules: OptOutGroupRule[];

  constructor(rules: OptOutGroupRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutGroup): string[] {
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

  requireValid(item: OptOutGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutGroup[]): Map<string, string[]> {
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

export function defaultOptOutGroupValidator(): OptOutGroupValidator {
  return new OptOutGroupValidator(
    [
      new OptOutGroupLabelLengthRule(64),
      new OptOutGroupMaximumRangeRule(7.7, 370.3),
      new OptOutGroupRequiredCodeRule("opt out group needs this field"),
      new OptOutGroupRequiredLabelRule("opt out group needs this field"),
    ],
  );
}
