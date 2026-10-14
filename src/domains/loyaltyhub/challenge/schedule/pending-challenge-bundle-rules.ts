import { PendingChallengeBundle } from "./pending-challenge-bundle.js";

/** A rule a pending challenge bundle must pass. Check returns its problems, or none. */
export interface PendingChallengeBundleRule {
  check(item: PendingChallengeBundle): string[];
}

export class PendingChallengeBundleNameLengthRule implements PendingChallengeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingChallengeBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingChallengeBundleRequiredCodeRule implements PendingChallengeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingChallengeBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingChallengeBundleRequiredLocaleRule implements PendingChallengeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingChallengeBundle): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending challenge bundle. */
export class PendingChallengeBundleValidator {
  rules: PendingChallengeBundleRule[];

  constructor(rules: PendingChallengeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingChallengeBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingChallengeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingChallengeBundle[]): Map<string, string[]> {
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

export function defaultPendingChallengeBundleValidator(): PendingChallengeBundleValidator {
  return new PendingChallengeBundleValidator(
    [
      new PendingChallengeBundleNameLengthRule(120),
      new PendingChallengeBundleRequiredCodeRule("pending challenge bundle needs a value"),
      new PendingChallengeBundleRequiredLocaleRule("pending challenge bundle needs a value"),
    ],
  );
}
