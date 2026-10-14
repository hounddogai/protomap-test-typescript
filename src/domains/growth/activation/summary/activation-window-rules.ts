import { ActivationWindow } from "./activation-window.js";

/** A rule a activation window must pass. Check returns its problems, or none. */
export interface ActivationWindowRule {
  check(item: ActivationWindow): string[];
}

export class ActivationWindowCodeLengthRule implements ActivationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationWindowWindowDaysRangeRule implements ActivationWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationWindow): string[] {
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

export class ActivationWindowRequiredTitleRule implements ActivationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation window. */
export class ActivationWindowValidator {
  rules: ActivationWindowRule[];

  constructor(rules: ActivationWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationWindow[]): Map<string, string[]> {
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

export function defaultActivationWindowValidator(): ActivationWindowValidator {
  return new ActivationWindowValidator(
    [
      new ActivationWindowCodeLengthRule(80),
      new ActivationWindowWindowDaysRangeRule(255, 255),
      new ActivationWindowRequiredTitleRule("activation window needs an entry"),
    ],
  );
}
