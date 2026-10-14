import { DoubleOptInWindow } from "./double-opt-in-window.js";

/** A rule a double opt in window must pass. Check returns its problems, or none. */
export interface DoubleOptInWindowRule {
  check(item: DoubleOptInWindow): string[];
}

export class DoubleOptInWindowTitleLengthRule implements DoubleOptInWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInWindowWindowDaysRangeRule implements DoubleOptInWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInWindow): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInWindowCampaignRefLengthRule implements DoubleOptInWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInWindow): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInWindowRequiredTitleRule implements DoubleOptInWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInWindowRequiredCampaignRefRule implements DoubleOptInWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInWindow): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in window. */
export class DoubleOptInWindowValidator {
  rules: DoubleOptInWindowRule[];

  constructor(rules: DoubleOptInWindowRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInWindow[]): Map<string, string[]> {
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

export function defaultDoubleOptInWindowValidator(): DoubleOptInWindowValidator {
  return new DoubleOptInWindowValidator(
    [
      new DoubleOptInWindowTitleLengthRule(120),
      new DoubleOptInWindowWindowDaysRangeRule(16, 120),
      new DoubleOptInWindowCampaignRefLengthRule(255),
      new DoubleOptInWindowRequiredTitleRule("double opt in window needs an entry"),
      new DoubleOptInWindowRequiredCampaignRefRule("double opt in window needs this field"),
    ],
  );
}
