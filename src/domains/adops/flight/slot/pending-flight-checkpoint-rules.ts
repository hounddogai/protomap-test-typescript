import { PendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

/** A rule a pending flight checkpoint must pass. Check returns its problems, or none. */
export interface PendingFlightCheckpointRule {
  check(item: PendingFlightCheckpoint): string[];
}

export class PendingFlightCheckpointRequiredTitleRule implements PendingFlightCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFlightCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFlightCheckpointEndsAtRangeRule implements PendingFlightCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFlightCheckpoint): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingFlightCheckpointCodePrefixRule implements PendingFlightCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingFlightCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending flight checkpoint. */
export class PendingFlightCheckpointValidator {
  rules: PendingFlightCheckpointRule[];

  constructor(rules: PendingFlightCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFlightCheckpoint): string[] {
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

  requireValid(item: PendingFlightCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFlightCheckpoint[]): Map<string, string[]> {
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

export function defaultPendingFlightCheckpointValidator(): PendingFlightCheckpointValidator {
  return new PendingFlightCheckpointValidator(
    [
      new PendingFlightCheckpointRequiredTitleRule("pending flight checkpoint needs this field"),
      new PendingFlightCheckpointEndsAtRangeRule(16, 255),
      new PendingFlightCheckpointCodePrefixRule("ACM"),
    ],
  );
}
