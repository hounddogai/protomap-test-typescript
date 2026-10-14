import { ScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

/** A rule a scheduled nudge profile must pass. Check returns its problems, or none. */
export interface ScheduledNudgeProfileRule {
  check(item: ScheduledNudgeProfile): string[];
}

export class ScheduledNudgeProfileRequiredLabelRule implements ScheduledNudgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledNudgeProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledNudgeProfileReviewerLengthRule implements ScheduledNudgeProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledNudgeProfile): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledNudgeProfileSendAtRangeRule implements ScheduledNudgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledNudgeProfile): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled nudge profile. */
export class ScheduledNudgeProfileValidator {
  rules: ScheduledNudgeProfileRule[];

  constructor(rules: ScheduledNudgeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledNudgeProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledNudgeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledNudgeProfile[]): Map<string, string[]> {
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

export function defaultScheduledNudgeProfileValidator(): ScheduledNudgeProfileValidator {
  return new ScheduledNudgeProfileValidator(
    [
      new ScheduledNudgeProfileRequiredLabelRule("scheduled nudge profile needs an entry"),
      new ScheduledNudgeProfileReviewerLengthRule(32),
      new ScheduledNudgeProfileSendAtRangeRule(32, 80),
    ],
  );
}
