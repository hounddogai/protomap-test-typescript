import { ChallengeBundle } from "./challenge-bundle.js";

/** A rule a challenge bundle must pass. Check returns its problems, or none. */
export interface ChallengeBundleRule {
  check(item: ChallengeBundle): string[];
}

export class ChallengeBundleRequiredUtmSourceRule implements ChallengeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeBundle): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeBundleCodePrefixRule implements ChallengeBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeBundleArchivedGuardRule implements ChallengeBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ChallengeBundle): string[] {
    if (item.archived && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ChallengeBundleRequiredNameRule implements ChallengeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge bundle. */
export class ChallengeBundleValidator {
  rules: ChallengeBundleRule[];

  constructor(rules: ChallengeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeBundle[]): Map<string, string[]> {
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

export function defaultChallengeBundleValidator(): ChallengeBundleValidator {
  return new ChallengeBundleValidator(
    [
      new ChallengeBundleRequiredUtmSourceRule("challenge bundle needs a value"),
      new ChallengeBundleCodePrefixRule("REF"),
      new ChallengeBundleArchivedGuardRule(16),
      new ChallengeBundleRequiredNameRule("challenge bundle needs this field"),
    ],
  );
}
