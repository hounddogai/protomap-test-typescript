import { ComplaintCheckpoint } from "./complaint-checkpoint.js";

/** A rule a complaint checkpoint must pass. Check returns its problems, or none. */
export interface ComplaintCheckpointRule {
  check(item: ComplaintCheckpoint): string[];
}

export class ComplaintCheckpointNameLengthRule implements ComplaintCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintCheckpointRequiredNameRule implements ComplaintCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintCheckpointArchivedGuardRule implements ComplaintCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ComplaintCheckpoint): string[] {
    if (item.archived && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ComplaintCheckpointRequiredOwnerIdRule implements ComplaintCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintCheckpoint): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint checkpoint. */
export class ComplaintCheckpointValidator {
  rules: ComplaintCheckpointRule[];

  constructor(rules: ComplaintCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintCheckpoint[]): Map<string, string[]> {
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

export function defaultComplaintCheckpointValidator(): ComplaintCheckpointValidator {
  return new ComplaintCheckpointValidator(
    [
      new ComplaintCheckpointNameLengthRule(16),
      new ComplaintCheckpointRequiredNameRule("complaint checkpoint needs this field"),
      new ComplaintCheckpointArchivedGuardRule(9.4),
      new ComplaintCheckpointRequiredOwnerIdRule("complaint checkpoint needs a value"),
    ],
  );
}
