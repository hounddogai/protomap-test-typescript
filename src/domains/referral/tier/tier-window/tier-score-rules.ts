import { TierScore } from "./tier-score.js";

/** A rule a tier score must pass. Check returns its problems, or none. */
export interface TierScoreRule {
  check(item: TierScore): string[];
}

export class TierScoreRequiredCohortRule implements TierScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierScore): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class TierScoreCodePrefixRule implements TierScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TierScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TierScoreRequiredCodeRule implements TierScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierScoreRequiredNameRule implements TierScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier score. */
export class TierScoreValidator {
  rules: TierScoreRule[];

  constructor(rules: TierScoreRule[]) {
    this.rules = rules;
  }

  validate(item: TierScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierScore[]): Map<string, string[]> {
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

export function defaultTierScoreValidator(): TierScoreValidator {
  return new TierScoreValidator(
    [
      new TierScoreRequiredCohortRule("tier score needs this field"),
      new TierScoreCodePrefixRule("Q"),
      new TierScoreRequiredCodeRule("tier score needs a value"),
      new TierScoreRequiredNameRule("tier score needs a value"),
    ],
  );
}
