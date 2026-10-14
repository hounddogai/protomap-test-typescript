import { RollingPostScore } from "./rolling-post-score.js";

/** A rule a rolling post score must pass. Check returns its problems, or none. */
export interface RollingPostScoreRule {
  check(item: RollingPostScore): string[];
}

export class RollingPostScoreCodeLengthRule implements RollingPostScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPostScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPostScoreRequiredTitleRule implements RollingPostScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPostScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPostScoreRequiredDescriptionRule implements RollingPostScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPostScore): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling post score. */
export class RollingPostScoreValidator {
  rules: RollingPostScoreRule[];

  constructor(rules: RollingPostScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPostScore): string[] {
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

  requireValid(item: RollingPostScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPostScore[]): Map<string, string[]> {
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

export function defaultRollingPostScoreValidator(): RollingPostScoreValidator {
  return new RollingPostScoreValidator(
    [
      new RollingPostScoreCodeLengthRule(32),
      new RollingPostScoreRequiredTitleRule("rolling post score needs this field"),
      new RollingPostScoreRequiredDescriptionRule("rolling post score needs a value"),
    ],
  );
}
