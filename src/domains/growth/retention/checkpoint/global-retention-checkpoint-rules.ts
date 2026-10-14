import { GlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

/** A rule a global retention checkpoint must pass. Check returns its problems, or none. */
export interface GlobalRetentionCheckpointRule {
  check(item: GlobalRetentionCheckpoint): string[];
}

export class GlobalRetentionCheckpointCodePrefixRule implements GlobalRetentionCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalRetentionCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalRetentionCheckpointRequiredUnitRule implements GlobalRetentionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionCheckpoint): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionCheckpointCodeLengthRule implements GlobalRetentionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global retention checkpoint. */
export class GlobalRetentionCheckpointValidator {
  rules: GlobalRetentionCheckpointRule[];

  constructor(rules: GlobalRetentionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRetentionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRetentionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRetentionCheckpoint[]): Map<string, string[]> {
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

export function defaultGlobalRetentionCheckpointValidator(): GlobalRetentionCheckpointValidator {
  return new GlobalRetentionCheckpointValidator(
    [
      new GlobalRetentionCheckpointCodePrefixRule("ACM"),
      new GlobalRetentionCheckpointRequiredUnitRule("global retention checkpoint needs an entry"),
      new GlobalRetentionCheckpointCodeLengthRule(64),
    ],
  );
}
