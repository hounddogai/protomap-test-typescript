import { RollingPostCheckpoint } from "./rolling-post-checkpoint.js";

/** A rule a rolling post checkpoint must pass. Check returns its problems, or none. */
export interface RollingPostCheckpointRule {
  check(item: RollingPostCheckpoint): string[];
}

export class RollingPostCheckpointUtmSourceLengthRule implements RollingPostCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPostCheckpoint): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPostCheckpointArchivedGuardRule implements RollingPostCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingPostCheckpoint): string[] {
    if (item.archived && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class RollingPostCheckpointExternalRefLengthRule implements RollingPostCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPostCheckpoint): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPostCheckpointRequiredCodeRule implements RollingPostCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPostCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling post checkpoint. */
export class RollingPostCheckpointValidator {
  rules: RollingPostCheckpointRule[];

  constructor(rules: RollingPostCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPostCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPostCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPostCheckpoint[]): Map<string, string[]> {
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

export function defaultRollingPostCheckpointValidator(): RollingPostCheckpointValidator {
  return new RollingPostCheckpointValidator(
    [
      new RollingPostCheckpointUtmSourceLengthRule(3600),
      new RollingPostCheckpointArchivedGuardRule(5.6),
      new RollingPostCheckpointExternalRefLengthRule(120),
      new RollingPostCheckpointRequiredCodeRule("rolling post checkpoint needs a value"),
    ],
  );
}
