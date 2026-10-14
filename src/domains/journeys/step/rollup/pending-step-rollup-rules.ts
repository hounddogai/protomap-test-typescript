import { PendingStepRollup } from "./pending-step-rollup.js";

/** A rule a pending step rollup must pass. Check returns its problems, or none. */
export interface PendingStepRollupRule {
  check(item: PendingStepRollup): string[];
}

export class PendingStepRollupArchivedGuardRule implements PendingStepRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingStepRollup): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PendingStepRollupChannelLengthRule implements PendingStepRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingStepRollup): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingStepRollupCodeLengthRule implements PendingStepRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingStepRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending step rollup. */
export class PendingStepRollupValidator {
  rules: PendingStepRollupRule[];

  constructor(rules: PendingStepRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PendingStepRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingStepRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingStepRollup[]): Map<string, string[]> {
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

export function defaultPendingStepRollupValidator(): PendingStepRollupValidator {
  return new PendingStepRollupValidator(
    [
      new PendingStepRollupArchivedGuardRule(4.7),
      new PendingStepRollupChannelLengthRule(16),
      new PendingStepRollupCodeLengthRule(32),
    ],
  );
}
