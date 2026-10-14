import { ManualInviteCheckpoint } from "./manual-invite-checkpoint.js";

/** A rule a manual invite checkpoint must pass. Check returns its problems, or none. */
export interface ManualInviteCheckpointRule {
  check(item: ManualInviteCheckpoint): string[];
}

export class ManualInviteCheckpointCodeLengthRule implements ManualInviteCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualInviteCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualInviteCheckpointUpdatedAtRangeRule implements ManualInviteCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualInviteCheckpoint): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualInviteCheckpointRequiredLocaleRule implements ManualInviteCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualInviteCheckpoint): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ManualInviteCheckpointLocaleLengthRule implements ManualInviteCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualInviteCheckpoint): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual invite checkpoint. */
export class ManualInviteCheckpointValidator {
  rules: ManualInviteCheckpointRule[];

  constructor(rules: ManualInviteCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ManualInviteCheckpoint): string[] {
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

  requireValid(item: ManualInviteCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualInviteCheckpoint[]): Map<string, string[]> {
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

export function defaultManualInviteCheckpointValidator(): ManualInviteCheckpointValidator {
  return new ManualInviteCheckpointValidator(
    [
      new ManualInviteCheckpointCodeLengthRule(80),
      new ManualInviteCheckpointUpdatedAtRangeRule(32, 64),
      new ManualInviteCheckpointRequiredLocaleRule("manual invite checkpoint needs this field"),
      new ManualInviteCheckpointLocaleLengthRule(1000),
    ],
  );
}
