import { ScheduledFlightNotice } from "./scheduled-flight-notice.js";

/** A rule a scheduled flight notice must pass. Check returns its problems, or none. */
export interface ScheduledFlightNoticeRule {
  check(item: ScheduledFlightNotice): string[];
}

export class ScheduledFlightNoticeSequenceRangeRule implements ScheduledFlightNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFlightNotice): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledFlightNoticeRequiredTitleRule implements ScheduledFlightNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFlightNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFlightNoticeRequiredOwnerIdRule implements ScheduledFlightNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFlightNotice): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled flight notice. */
export class ScheduledFlightNoticeValidator {
  rules: ScheduledFlightNoticeRule[];

  constructor(rules: ScheduledFlightNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFlightNotice): string[] {
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

  requireValid(item: ScheduledFlightNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFlightNotice[]): Map<string, string[]> {
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

export function defaultScheduledFlightNoticeValidator(): ScheduledFlightNoticeValidator {
  return new ScheduledFlightNoticeValidator(
    [
      new ScheduledFlightNoticeSequenceRangeRule(255, 1000),
      new ScheduledFlightNoticeRequiredTitleRule("scheduled flight notice needs an entry"),
      new ScheduledFlightNoticeRequiredOwnerIdRule("scheduled flight notice needs a value"),
    ],
  );
}
