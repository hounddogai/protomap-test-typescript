import { AdaptiveDomainScore } from "./adaptive-domain-score.js";

/** A rule a adaptive domain score must pass. Check returns its problems, or none. */
export interface AdaptiveDomainScoreRule {
  check(item: AdaptiveDomainScore): string[];
}

export class AdaptiveDomainScoreJourneyIdLengthRule implements AdaptiveDomainScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainScore): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDomainScoreCostRangeRule implements AdaptiveDomainScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDomainScore): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveDomainScoreSequenceRangeRule implements AdaptiveDomainScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDomainScore): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive domain score. */
export class AdaptiveDomainScoreValidator {
  rules: AdaptiveDomainScoreRule[];

  constructor(rules: AdaptiveDomainScoreRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDomainScore): string[] {
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

  requireValid(item: AdaptiveDomainScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDomainScore[]): Map<string, string[]> {
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

export function defaultAdaptiveDomainScoreValidator(): AdaptiveDomainScoreValidator {
  return new AdaptiveDomainScoreValidator(
    [
      new AdaptiveDomainScoreJourneyIdLengthRule(3600),
      new AdaptiveDomainScoreCostRangeRule(9.9, 3641.9),
      new AdaptiveDomainScoreSequenceRangeRule(80, 80),
    ],
  );
}
