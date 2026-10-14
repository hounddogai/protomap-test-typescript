import * as text from "../../../../kit/text.js";
import { LegacyQueueCheckpoint } from "./legacy-queue-checkpoint.js";

/** A rule a legacy queue checkpoint must pass. Check returns its problems, or none. */
export interface LegacyQueueCheckpointRule {
  check(item: LegacyQueueCheckpoint): string[];
}

export class LegacyQueueCheckpointLabelLengthRule implements LegacyQueueCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyQueueCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyQueueCheckpointApprovedGuardRule implements LegacyQueueCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyQueueCheckpoint): string[] {
    if (item.approved && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LegacyQueueCheckpointAllowedLabelRule implements LegacyQueueCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyQueueCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class LegacyQueueCheckpointRequiredCodeRule implements LegacyQueueCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyQueueCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy queue checkpoint. */
export class LegacyQueueCheckpointValidator {
  rules: LegacyQueueCheckpointRule[];

  constructor(rules: LegacyQueueCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyQueueCheckpoint): string[] {
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

  requireValid(item: LegacyQueueCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyQueueCheckpoint[]): Map<string, string[]> {
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

export function defaultLegacyQueueCheckpointValidator(): LegacyQueueCheckpointValidator {
  return new LegacyQueueCheckpointValidator(
    [
      new LegacyQueueCheckpointLabelLengthRule(1000),
      new LegacyQueueCheckpointApprovedGuardRule(3.1),
      new LegacyQueueCheckpointAllowedLabelRule(["primary", "primary", "lenient"]),
      new LegacyQueueCheckpointRequiredCodeRule("legacy queue checkpoint needs a value"),
    ],
  );
}
