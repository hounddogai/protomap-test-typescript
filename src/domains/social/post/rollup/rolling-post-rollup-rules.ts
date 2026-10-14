import { RollingPostRollup } from "./rolling-post-rollup.js";

/** A rule a rolling post rollup must pass. Check returns its problems, or none. */
export interface RollingPostRollupRule {
  check(item: RollingPostRollup): string[];
}

export class RollingPostRollupLabelLengthRule implements RollingPostRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPostRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPostRollupRequiredCodeRule implements RollingPostRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPostRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPostRollupArchivedGuardRule implements RollingPostRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingPostRollup): string[] {
    if (item.archived && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a rolling post rollup. */
export class RollingPostRollupValidator {
  rules: RollingPostRollupRule[];

  constructor(rules: RollingPostRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPostRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPostRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPostRollup[]): Map<string, string[]> {
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

export function defaultRollingPostRollupValidator(): RollingPostRollupValidator {
  return new RollingPostRollupValidator(
    [
      new RollingPostRollupLabelLengthRule(32),
      new RollingPostRollupRequiredCodeRule("rolling post rollup needs this field"),
      new RollingPostRollupArchivedGuardRule(3.2),
    ],
  );
}
