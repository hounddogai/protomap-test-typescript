import { ScheduledSubscriptionCheckpoint } from "./scheduled-subscription-checkpoint.js";

/** A rule a scheduled subscription checkpoint must pass. Check returns its problems, or none. */
export interface ScheduledSubscriptionCheckpointRule {
  check(item: ScheduledSubscriptionCheckpoint): string[];
}

export class ScheduledSubscriptionCheckpointRequiredLabelRule implements ScheduledSubscriptionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSubscriptionCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSubscriptionCheckpointCodeLengthRule implements ScheduledSubscriptionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionCheckpointSummaryLengthRule implements ScheduledSubscriptionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionCheckpoint): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionCheckpointRequiredCodeRule implements ScheduledSubscriptionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSubscriptionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSubscriptionCheckpointRequiredSummaryRule implements ScheduledSubscriptionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSubscriptionCheckpoint): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled subscription checkpoint. */
export class ScheduledSubscriptionCheckpointValidator {
  rules: ScheduledSubscriptionCheckpointRule[];

  constructor(rules: ScheduledSubscriptionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSubscriptionCheckpoint): string[] {
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

  requireValid(item: ScheduledSubscriptionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSubscriptionCheckpoint[]): Map<string, string[]> {
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

export function defaultScheduledSubscriptionCheckpointValidator(): ScheduledSubscriptionCheckpointValidator {
  return new ScheduledSubscriptionCheckpointValidator(
    [
      new ScheduledSubscriptionCheckpointRequiredLabelRule("scheduled subscription checkpoint needs a value"),
      new ScheduledSubscriptionCheckpointCodeLengthRule(255),
      new ScheduledSubscriptionCheckpointSummaryLengthRule(255),
      new ScheduledSubscriptionCheckpointRequiredCodeRule("scheduled subscription checkpoint needs a value"),
      new ScheduledSubscriptionCheckpointRequiredSummaryRule("scheduled subscription checkpoint needs a value"),
    ],
  );
}
