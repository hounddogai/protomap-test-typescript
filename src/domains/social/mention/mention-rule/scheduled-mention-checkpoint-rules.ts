import { ScheduledMentionCheckpoint } from "./scheduled-mention-checkpoint.js";

/** A rule a scheduled mention checkpoint must pass. Check returns its problems, or none. */
export interface ScheduledMentionCheckpointRule {
  check(item: ScheduledMentionCheckpoint): string[];
}

export class ScheduledMentionCheckpointRequiredDescriptionRule implements ScheduledMentionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMentionCheckpoint): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMentionCheckpointCodePrefixRule implements ScheduledMentionCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledMentionCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledMentionCheckpointRequiredCodeRule implements ScheduledMentionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMentionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMentionCheckpointVisibleGuardRule implements ScheduledMentionCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledMentionCheckpoint): string[] {
    if (item.visible && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ScheduledMentionCheckpointDescriptionLengthRule implements ScheduledMentionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMentionCheckpoint): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMentionCheckpointRequiredNameRule implements ScheduledMentionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMentionCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled mention checkpoint. */
export class ScheduledMentionCheckpointValidator {
  rules: ScheduledMentionCheckpointRule[];

  constructor(rules: ScheduledMentionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledMentionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledMentionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledMentionCheckpoint[]): Map<string, string[]> {
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

export function defaultScheduledMentionCheckpointValidator(): ScheduledMentionCheckpointValidator {
  return new ScheduledMentionCheckpointValidator(
    [
      new ScheduledMentionCheckpointRequiredDescriptionRule("scheduled mention checkpoint needs this field"),
      new ScheduledMentionCheckpointCodePrefixRule("Q"),
      new ScheduledMentionCheckpointRequiredCodeRule("scheduled mention checkpoint needs an entry"),
      new ScheduledMentionCheckpointVisibleGuardRule(9.4),
      new ScheduledMentionCheckpointDescriptionLengthRule(3600),
      new ScheduledMentionCheckpointRequiredNameRule("scheduled mention checkpoint needs a value"),
    ],
  );
}
