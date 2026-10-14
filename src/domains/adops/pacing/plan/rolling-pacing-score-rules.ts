import { RollingPacingScore } from "./rolling-pacing-score.js";

/** A rule a rolling pacing score must pass. Check returns its problems, or none. */
export interface RollingPacingScoreRule {
  check(item: RollingPacingScore): string[];
}

export class RollingPacingScoreNameLengthRule implements RollingPacingScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPacingScoreApprovedGuardRule implements RollingPacingScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingPacingScore): string[] {
    if (item.approved && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class RollingPacingScoreCodePrefixRule implements RollingPacingScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingPacingScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingPacingScoreCodeLengthRule implements RollingPacingScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling pacing score. */
export class RollingPacingScoreValidator {
  rules: RollingPacingScoreRule[];

  constructor(rules: RollingPacingScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPacingScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPacingScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPacingScore[]): Map<string, string[]> {
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

export function defaultRollingPacingScoreValidator(): RollingPacingScoreValidator {
  return new RollingPacingScoreValidator(
    [
      new RollingPacingScoreNameLengthRule(80),
      new RollingPacingScoreApprovedGuardRule(80),
      new RollingPacingScoreCodePrefixRule("ACM"),
      new RollingPacingScoreCodeLengthRule(120),
    ],
  );
}
