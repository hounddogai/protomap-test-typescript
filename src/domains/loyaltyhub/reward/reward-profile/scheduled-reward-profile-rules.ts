import { ScheduledRewardProfile } from "./scheduled-reward-profile.js";

/** A rule a scheduled reward profile must pass. Check returns its problems, or none. */
export interface ScheduledRewardProfileRule {
  check(item: ScheduledRewardProfile): string[];
}

export class ScheduledRewardProfileCodeLengthRule implements ScheduledRewardProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRewardProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRewardProfileLabelLengthRule implements ScheduledRewardProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRewardProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRewardProfileReviewerLengthRule implements ScheduledRewardProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRewardProfile): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRewardProfileRequiredReviewerRule implements ScheduledRewardProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRewardProfile): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRewardProfileMarginRangeRule implements ScheduledRewardProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRewardProfile): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled reward profile. */
export class ScheduledRewardProfileValidator {
  rules: ScheduledRewardProfileRule[];

  constructor(rules: ScheduledRewardProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRewardProfile): string[] {
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

  requireValid(item: ScheduledRewardProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRewardProfile[]): Map<string, string[]> {
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

export function defaultScheduledRewardProfileValidator(): ScheduledRewardProfileValidator {
  return new ScheduledRewardProfileValidator(
    [
      new ScheduledRewardProfileCodeLengthRule(120),
      new ScheduledRewardProfileLabelLengthRule(1000),
      new ScheduledRewardProfileReviewerLengthRule(1000),
      new ScheduledRewardProfileRequiredReviewerRule("scheduled reward profile needs an entry"),
      new ScheduledRewardProfileMarginRangeRule(8.7, 2404.8),
    ],
  );
}
