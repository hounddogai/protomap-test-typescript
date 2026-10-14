import { RegionalBounceScore } from "./regional-bounce-score.js";

/** A rule a regional bounce score must pass. Check returns its problems, or none. */
export interface RegionalBounceScoreRule {
  check(item: RegionalBounceScore): string[];
}

export class RegionalBounceScoreRequiredTitleRule implements RegionalBounceScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalBounceScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalBounceScoreCodeLengthRule implements RegionalBounceScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBounceScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBounceScoreUnitLengthRule implements RegionalBounceScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBounceScore): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional bounce score. */
export class RegionalBounceScoreValidator {
  rules: RegionalBounceScoreRule[];

  constructor(rules: RegionalBounceScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBounceScore): string[] {
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

  requireValid(item: RegionalBounceScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBounceScore[]): Map<string, string[]> {
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

export function defaultRegionalBounceScoreValidator(): RegionalBounceScoreValidator {
  return new RegionalBounceScoreValidator(
    [
      new RegionalBounceScoreRequiredTitleRule("regional bounce score needs a value"),
      new RegionalBounceScoreCodeLengthRule(3600),
      new RegionalBounceScoreUnitLengthRule(86400),
    ],
  );
}
