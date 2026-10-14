import { ChallengeException } from "./challenge-exception.js";

/** A rule a challenge exception must pass. Check returns its problems, or none. */
export interface ChallengeExceptionRule {
  check(item: ChallengeException): string[];
}

export class ChallengeExceptionCodePrefixRule implements ChallengeExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeExceptionRequiredLabelRule implements ChallengeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeExceptionCreatedAtRangeRule implements ChallengeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeException): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a challenge exception. */
export class ChallengeExceptionValidator {
  rules: ChallengeExceptionRule[];

  constructor(rules: ChallengeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeException): string[] {
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

  requireValid(item: ChallengeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeException[]): Map<string, string[]> {
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

export function defaultChallengeExceptionValidator(): ChallengeExceptionValidator {
  return new ChallengeExceptionValidator(
    [
      new ChallengeExceptionCodePrefixRule("ACM"),
      new ChallengeExceptionRequiredLabelRule("challenge exception needs a value"),
      new ChallengeExceptionCreatedAtRangeRule(1000, 3600),
    ],
  );
}
