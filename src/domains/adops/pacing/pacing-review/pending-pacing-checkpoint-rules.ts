import { PendingPacingCheckpoint } from "./pending-pacing-checkpoint.js";

/** A rule a pending pacing checkpoint must pass. Check returns its problems, or none. */
export interface PendingPacingCheckpointRule {
  check(item: PendingPacingCheckpoint): string[];
}

export class PendingPacingCheckpointRequiredNameRule implements PendingPacingCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPacingCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPacingCheckpointRequiredSummaryRule implements PendingPacingCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPacingCheckpoint): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPacingCheckpointCodeLengthRule implements PendingPacingCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPacingCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPacingCheckpointOwnerIdLengthRule implements PendingPacingCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPacingCheckpoint): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPacingCheckpointNameLengthRule implements PendingPacingCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPacingCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending pacing checkpoint. */
export class PendingPacingCheckpointValidator {
  rules: PendingPacingCheckpointRule[];

  constructor(rules: PendingPacingCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPacingCheckpoint): string[] {
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

  requireValid(item: PendingPacingCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPacingCheckpoint[]): Map<string, string[]> {
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

export function defaultPendingPacingCheckpointValidator(): PendingPacingCheckpointValidator {
  return new PendingPacingCheckpointValidator(
    [
      new PendingPacingCheckpointRequiredNameRule("pending pacing checkpoint needs a value"),
      new PendingPacingCheckpointRequiredSummaryRule("pending pacing checkpoint needs this field"),
      new PendingPacingCheckpointCodeLengthRule(64),
      new PendingPacingCheckpointOwnerIdLengthRule(86400),
      new PendingPacingCheckpointNameLengthRule(120),
    ],
  );
}
