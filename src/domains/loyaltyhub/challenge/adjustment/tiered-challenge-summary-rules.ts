import { TieredChallengeSummary } from "./tiered-challenge-summary.js";

/** A rule a tiered challenge summary must pass. Check returns its problems, or none. */
export interface TieredChallengeSummaryRule {
  check(item: TieredChallengeSummary): string[];
}

export class TieredChallengeSummaryCodePrefixRule implements TieredChallengeSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredChallengeSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredChallengeSummaryScoreRangeRule implements TieredChallengeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredChallengeSummary): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredChallengeSummaryRequiredLabelRule implements TieredChallengeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredChallengeSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered challenge summary. */
export class TieredChallengeSummaryValidator {
  rules: TieredChallengeSummaryRule[];

  constructor(rules: TieredChallengeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredChallengeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredChallengeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredChallengeSummary[]): Map<string, string[]> {
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

export function defaultTieredChallengeSummaryValidator(): TieredChallengeSummaryValidator {
  return new TieredChallengeSummaryValidator(
    [
      new TieredChallengeSummaryCodePrefixRule("OPS"),
      new TieredChallengeSummaryScoreRangeRule(9.3, 972.2),
      new TieredChallengeSummaryRequiredLabelRule("tiered challenge summary needs an entry"),
    ],
  );
}
