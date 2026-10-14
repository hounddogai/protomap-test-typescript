import { ScheduledPlacementNotice } from "./scheduled-placement-notice.js";

/** A rule a scheduled placement notice must pass. Check returns its problems, or none. */
export interface ScheduledPlacementNoticeRule {
  check(item: ScheduledPlacementNotice): string[];
}

export class ScheduledPlacementNoticeWeightRangeRule implements ScheduledPlacementNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPlacementNotice): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledPlacementNoticeLabelLengthRule implements ScheduledPlacementNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPlacementNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPlacementNoticeReviewerLengthRule implements ScheduledPlacementNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPlacementNotice): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPlacementNoticeCodeLengthRule implements ScheduledPlacementNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPlacementNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPlacementNoticeRequiredLabelRule implements ScheduledPlacementNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPlacementNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPlacementNoticeRequiredCodeRule implements ScheduledPlacementNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPlacementNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled placement notice. */
export class ScheduledPlacementNoticeValidator {
  rules: ScheduledPlacementNoticeRule[];

  constructor(rules: ScheduledPlacementNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPlacementNotice): string[] {
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

  requireValid(item: ScheduledPlacementNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPlacementNotice[]): Map<string, string[]> {
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

export function defaultScheduledPlacementNoticeValidator(): ScheduledPlacementNoticeValidator {
  return new ScheduledPlacementNoticeValidator(
    [
      new ScheduledPlacementNoticeWeightRangeRule(3.5, 4732.7),
      new ScheduledPlacementNoticeLabelLengthRule(255),
      new ScheduledPlacementNoticeReviewerLengthRule(80),
      new ScheduledPlacementNoticeCodeLengthRule(255),
      new ScheduledPlacementNoticeRequiredLabelRule("scheduled placement notice needs an entry"),
      new ScheduledPlacementNoticeRequiredCodeRule("scheduled placement notice needs this field"),
    ],
  );
}
