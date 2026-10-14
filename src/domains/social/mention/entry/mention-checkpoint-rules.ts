import { MentionCheckpoint } from "./mention-checkpoint.js";

/** A rule a mention checkpoint must pass. Check returns its problems, or none. */
export interface MentionCheckpointRule {
  check(item: MentionCheckpoint): string[];
}

export class MentionCheckpointUpdatedAtRangeRule implements MentionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionCheckpoint): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionCheckpointLabelLengthRule implements MentionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionCheckpointRequiredLabelRule implements MentionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class MentionCheckpointCodeLengthRule implements MentionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention checkpoint. */
export class MentionCheckpointValidator {
  rules: MentionCheckpointRule[];

  constructor(rules: MentionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: MentionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionCheckpoint[]): Map<string, string[]> {
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

export function defaultMentionCheckpointValidator(): MentionCheckpointValidator {
  return new MentionCheckpointValidator(
    [
      new MentionCheckpointUpdatedAtRangeRule(32, 86400),
      new MentionCheckpointLabelLengthRule(16),
      new MentionCheckpointRequiredLabelRule("mention checkpoint needs an entry"),
      new MentionCheckpointCodeLengthRule(1000),
    ],
  );
}
