import { ScheduledSlaWindow } from "./scheduled-sla-window.js";

/** A rule a scheduled sla window must pass. Check returns its problems, or none. */
export interface ScheduledSlaWindowRule {
  check(item: ScheduledSlaWindow): string[];
}

export class ScheduledSlaWindowAudienceIdLengthRule implements ScheduledSlaWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSlaWindow): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSlaWindowRequiredCodeRule implements ScheduledSlaWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSlaWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSlaWindowSendAtRangeRule implements ScheduledSlaWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSlaWindow): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledSlaWindowTitleLengthRule implements ScheduledSlaWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSlaWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSlaWindowRequiredSegmentRule implements ScheduledSlaWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSlaWindow): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled sla window. */
export class ScheduledSlaWindowValidator {
  rules: ScheduledSlaWindowRule[];

  constructor(rules: ScheduledSlaWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSlaWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledSlaWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSlaWindow[]): Map<string, string[]> {
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

export function defaultScheduledSlaWindowValidator(): ScheduledSlaWindowValidator {
  return new ScheduledSlaWindowValidator(
    [
      new ScheduledSlaWindowAudienceIdLengthRule(64),
      new ScheduledSlaWindowRequiredCodeRule("scheduled sla window needs an entry"),
      new ScheduledSlaWindowSendAtRangeRule(16, 64),
      new ScheduledSlaWindowTitleLengthRule(32),
      new ScheduledSlaWindowRequiredSegmentRule("scheduled sla window needs a value"),
    ],
  );
}
