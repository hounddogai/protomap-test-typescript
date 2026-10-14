import { SubscriptionWindow } from "./subscription-window.js";

/** A rule a subscription window must pass. Check returns its problems, or none. */
export interface SubscriptionWindowRule {
  check(item: SubscriptionWindow): string[];
}

export class SubscriptionWindowLabelLengthRule implements SubscriptionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionWindowScoreRangeRule implements SubscriptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionWindow): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionWindowRevisionRangeRule implements SubscriptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionWindow): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionWindowMarginRangeRule implements SubscriptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionWindow): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionWindowRequiredCodeRule implements SubscriptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription window. */
export class SubscriptionWindowValidator {
  rules: SubscriptionWindowRule[];

  constructor(rules: SubscriptionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionWindow[]): Map<string, string[]> {
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

export function defaultSubscriptionWindowValidator(): SubscriptionWindowValidator {
  return new SubscriptionWindowValidator(
    [
      new SubscriptionWindowLabelLengthRule(255),
      new SubscriptionWindowScoreRangeRule(3.9, 1226.5),
      new SubscriptionWindowRevisionRangeRule(16, 32),
      new SubscriptionWindowMarginRangeRule(8.9, 1617.3),
      new SubscriptionWindowRequiredCodeRule("subscription window needs a value"),
    ],
  );
}
