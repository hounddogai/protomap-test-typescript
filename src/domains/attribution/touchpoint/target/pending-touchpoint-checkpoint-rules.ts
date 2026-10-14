import { PendingTouchpointCheckpoint } from "./pending-touchpoint-checkpoint.js";

/** A rule a pending touchpoint checkpoint must pass. Check returns its problems, or none. */
export interface PendingTouchpointCheckpointRule {
  check(item: PendingTouchpointCheckpoint): string[];
}

export class PendingTouchpointCheckpointCeilingRangeRule implements PendingTouchpointCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingTouchpointCheckpoint): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingTouchpointCheckpointLabelLengthRule implements PendingTouchpointCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingTouchpointCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingTouchpointCheckpointCodeLengthRule implements PendingTouchpointCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingTouchpointCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingTouchpointCheckpointRequiredCodeRule implements PendingTouchpointCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingTouchpointCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending touchpoint checkpoint. */
export class PendingTouchpointCheckpointValidator {
  rules: PendingTouchpointCheckpointRule[];

  constructor(rules: PendingTouchpointCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PendingTouchpointCheckpoint): string[] {
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

  requireValid(item: PendingTouchpointCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingTouchpointCheckpoint[]): Map<string, string[]> {
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

export function defaultPendingTouchpointCheckpointValidator(): PendingTouchpointCheckpointValidator {
  return new PendingTouchpointCheckpointValidator(
    [
      new PendingTouchpointCheckpointCeilingRangeRule(8.1, 2458),
      new PendingTouchpointCheckpointLabelLengthRule(1000),
      new PendingTouchpointCheckpointCodeLengthRule(16),
      new PendingTouchpointCheckpointRequiredCodeRule("pending touchpoint checkpoint needs this field"),
    ],
  );
}
