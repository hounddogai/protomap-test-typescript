import { WindowGroup } from "./window-group.js";

/** A rule a window group must pass. Check returns its problems, or none. */
export interface WindowGroupRule {
  check(item: WindowGroup): string[];
}

export class WindowGroupFloorValueRangeRule implements WindowGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowGroup): string[] {
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

export class WindowGroupMaximumRangeRule implements WindowGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowGroup): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowGroupRequiredLocaleRule implements WindowGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowGroup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WindowGroupCodeLengthRule implements WindowGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowGroupLocaleLengthRule implements WindowGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowGroup): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a window group. */
export class WindowGroupValidator {
  rules: WindowGroupRule[];

  constructor(rules: WindowGroupRule[]) {
    this.rules = rules;
  }

  validate(item: WindowGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowGroup[]): Map<string, string[]> {
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

export function defaultWindowGroupValidator(): WindowGroupValidator {
  return new WindowGroupValidator(
    [
      new WindowGroupFloorValueRangeRule(1.9, 2466.3),
      new WindowGroupMaximumRangeRule(0.3, 3871.5),
      new WindowGroupRequiredLocaleRule("window group needs a value"),
      new WindowGroupCodeLengthRule(3600),
      new WindowGroupLocaleLengthRule(16),
    ],
  );
}
